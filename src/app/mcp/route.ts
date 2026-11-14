import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { z } from 'zod'
import { getClient } from '@/lib/data'
import { blocksToMarkdown, markdownToBlocks } from '@/lib/markdown'
import { SCOPE, siteOrigin, verify } from '@/lib/oauth'
import type { Where } from 'payload'
import type { Article } from '@/payload-types'

export const dynamic = 'force-dynamic'

/**
 * The blog's connector for AI assistants (Claude, ChatGPT and others that speak MCP).
 * Assistants can read content and create or edit DRAFT articles. They cannot publish,
 * unpublish or delete: publishing stays with a person in the editing panel.
 */

const text = (value: unknown) => ({
  content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
})
const failure = (message: string) => ({ content: [{ type: 'text' as const, text: message }], isError: true })

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

const level = z.enum(['beginner', 'intermediate', 'advanced'])
const coverLabels = z
  .array(z.string().min(1).max(18))
  .min(2)
  .max(4)
  .describe('Two to four short labels for the box-and-line cover diagram, left to right, e.g. ["Client", "Cache", "DB"].')

const summarise = (a: Article) => ({
  title: a.title,
  slug: a.slug,
  status: a.status,
  level: a.level,
  readMinutes: a.readMinutes,
  topic: a.topic && typeof a.topic === 'object' ? a.topic.slug : null,
  summary: a.dek,
})

async function topicId(slug?: string) {
  if (!slug) return undefined
  const payload = await getClient()
  const res = await payload.find({ collection: 'topics', where: { slug: { equals: slug } }, limit: 1 })
  return res.docs[0]?.id
}

const cover = (labels?: string[]) =>
  labels?.map((label, i) => ({ items: [{ label, style: i === 1 ? ('dark' as const) : ('plain' as const) }] }))

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'list_topics',
      {
        title: 'List topics',
        description: 'Use this to see the topics an article can be filed under. Returns each topic name and slug.',
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async () => {
        const payload = await getClient()
        const res = await payload.find({ collection: 'topics', sort: 'order', limit: 100 })
        return text(res.docs.map((t) => ({ name: t.name, slug: t.slug, description: t.description })))
      },
    )

    server.registerTool(
      'list_learning_paths',
      {
        title: 'List learning paths',
        description: 'Use this to see the learning paths and the ordered articles in each one.',
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async () => {
        const payload = await getClient()
        const res = await payload.find({ collection: 'paths', sort: 'order', depth: 1, limit: 50 })
        return text(
          res.docs.map((p) => ({
            title: p.title,
            slug: p.slug,
            level: p.level,
            articles: ((p.articles || []) as Article[]).filter((a) => typeof a === 'object').map((a) => ({ title: a.title, slug: a.slug, status: a.status })),
          })),
        )
      },
    )

    server.registerTool(
      'list_articles',
      {
        title: 'List articles',
        description: 'Use this to find existing articles, for example to avoid writing a duplicate or to find a draft to edit.',
        inputSchema: z.object({
          status: z.enum(['draft', 'published', 'any']).default('any').describe('Which articles to list.'),
          search: z.string().max(100).optional().describe('Words to look for in the title.'),
          limit: z.number().int().min(1).max(100).default(50),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ status, search, limit }) => {
        const payload = await getClient()
        const and: Where[] = [
          ...(status !== 'any' ? [{ status: { equals: status } }] : []),
          ...(search ? [{ title: { like: search } }] : []),
        ]
        const res = await payload.find({ collection: 'articles', where: and.length ? { and } : {}, sort: '-updatedAt', limit, depth: 1 })
        return text({ total: res.totalDocs, articles: res.docs.map((a) => summarise(a as Article)) })
      },
    )

    server.registerTool(
      'get_article',
      {
        title: 'Get an article',
        description: 'Use this to read one article, with its body as Markdown. Call it before editing a draft.',
        inputSchema: z.object({ slug: z.string().describe('The article slug, from list_articles.') }),
        annotations: { readOnlyHint: true },
      },
      async ({ slug }) => {
        const payload = await getClient()
        const res = await payload.find({ collection: 'articles', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
        const a = res.docs[0] as Article | undefined
        if (!a) return failure(`No article has the slug "${slug}".`)
        return text({ ...summarise(a), markdown: blocksToMarkdown(a.body) })
      },
    )

    server.registerTool(
      'create_draft_article',
      {
        title: 'Create a draft article',
        description:
          'Use this to save a new article to the blog as a DRAFT. It is not visible to readers until a person publishes it in the editing panel. ' +
          'Write the body in Markdown: ## headings, paragraphs, **bold**, `inline code`, lists, fenced code blocks, tables, and "> **Key takeaway:** ..." for a callout. ' +
          'Do not repeat the title as a heading. Images are not supported.',
        inputSchema: z.object({
          title: z.string().min(3).max(160),
          summary: z.string().min(10).max(300).describe('One or two sentences shown under the title and on cards.'),
          markdown: z.string().min(50).describe('The article body in Markdown.'),
          topic: z.string().optional().describe('Topic slug from list_topics.'),
          level: level.default('beginner'),
          readMinutes: z.number().int().min(1).max(120).optional().describe('Estimated reading time in minutes.'),
          coverLabels: coverLabels.optional(),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      },
      async (input, ctx) => {
        const payload = await getClient()
        const base = slugify(input.title)
        if (!base) return failure('The title needs at least one letter or digit.')
        const clash = await payload.find({ collection: 'articles', where: { slug: { equals: base } }, limit: 1, depth: 0 })
        const slug = clash.totalDocs ? `${base}-${Date.now().toString(36).slice(-4)}` : base
        const topic = await topicId(input.topic)
        if (input.topic && !topic) return failure(`No topic has the slug "${input.topic}". Call list_topics to see the options.`)
        const words = input.markdown.split(/\s+/).length
        const author = Number((ctx.http?.authInfo?.extra as { userId?: string } | undefined)?.userId) || undefined

        const doc = await payload.create({
          collection: 'articles',
          data: {
            title: input.title,
            slug,
            status: 'draft',
            dek: input.summary,
            topic,
            level: input.level,
            readMinutes: input.readMinutes ?? Math.max(1, Math.round(words / 200)),
            author,
            cover: cover(input.coverLabels),
            body: markdownToBlocks(input.markdown, input.title),
          },
        })
        return text({
          saved: 'draft',
          note: 'Saved as a draft. It is not visible to readers until someone publishes it in the editing panel.',
          title: doc.title,
          slug: doc.slug,
          previewUrl: `${siteOrigin()}/articles/${doc.slug}`, editUrl: `${siteOrigin()}/admin/collections/articles/${doc.id}`,
        })
      },
    )

    server.registerTool(
      'update_draft_article',
      {
        title: 'Update a draft article',
        description:
          'Use this to change an article that is still a draft. Published articles cannot be changed with this tool. ' +
          'Only the fields you pass are changed; passing markdown replaces the whole body.',
        inputSchema: z.object({
          slug: z.string().describe('Slug of the draft to change.'),
          title: z.string().min(3).max(160).optional(),
          summary: z.string().min(10).max(300).optional(),
          markdown: z.string().min(50).optional().describe('New body in Markdown; replaces the existing body.'),
          topic: z.string().optional().describe('Topic slug from list_topics.'),
          level: level.optional(),
          readMinutes: z.number().int().min(1).max(120).optional(),
          coverLabels: coverLabels.optional(),
        }),
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      },
      async (input) => {
        const payload = await getClient()
        const res = await payload.find({ collection: 'articles', where: { slug: { equals: input.slug } }, limit: 1, depth: 0 })
        const a = res.docs[0] as Article | undefined
        if (!a) return failure(`No article has the slug "${input.slug}".`)
        if (a.status !== 'draft') return failure('That article is published. Published articles can only be changed in the editing panel.')
        const topic = await topicId(input.topic)
        if (input.topic && !topic) return failure(`No topic has the slug "${input.topic}". Call list_topics to see the options.`)

        const doc = await payload.update({
          collection: 'articles',
          id: a.id,
          data: {
            ...(input.title ? { title: input.title } : {}),
            ...(input.summary ? { dek: input.summary } : {}),
            ...(input.markdown ? { body: markdownToBlocks(input.markdown, input.title || a.title) } : {}),
            ...(topic ? { topic } : {}),
            ...(input.level ? { level: input.level } : {}),
            ...(input.readMinutes ? { readMinutes: input.readMinutes } : {}),
            ...(input.coverLabels ? { cover: cover(input.coverLabels) } : {}),
          },
        })
        return text({ saved: 'draft', title: doc.title, slug: doc.slug, previewUrl: `${siteOrigin()}/articles/${doc.slug}`, editUrl: `${siteOrigin()}/admin/collections/articles/${doc.id}` })
      },
    )
  },
  { serverInfo: { name: 'system-design-blog', version: '1.0.0' } },
)

// Every request must carry a token issued by this site's /oauth/token to an admin.
const authed = withMcpAuth(
  handler,
  async (_req, bearer) => {
    if (!bearer) return undefined
    const claims = await verify<{ sub: string; cid: string; scope?: string; exp?: number }>('access', bearer)
    if (!claims?.sub) return undefined
    const payload = await getClient()
    try {
      await payload.findByID({ collection: 'users', id: claims.sub, depth: 0 })
    } catch {
      return undefined // the admin account was removed
    }
    return { token: bearer, clientId: claims.cid, scopes: [claims.scope || SCOPE], expiresAt: claims.exp, extra: { userId: claims.sub } }
  },
  { required: true, requiredScopes: [SCOPE], resourceMetadataPath: '/.well-known/oauth-protected-resource', resourceUrl: process.env.NEXT_PUBLIC_SITE_URL || undefined },
)

export { authed as GET, authed as POST, authed as DELETE }
