import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Article, User } from '@/payload-types'
import { formatDate, getClient, getLearner, getProgress, initials, isTeamMember, levelLabel, slugify, topicName } from '@/lib/data'
import { Footer, Header } from '@/components/Chrome'
import { Body } from '@/components/Body'
import { Cover } from '@/components/Cover'
import { Quiz } from '@/components/Quiz'
import { ReadTracker, ScrollProgress, ShareButton } from '@/components/ClientBits'
import { toggleSave } from '../../actions'

export const dynamic = 'force-dynamic'

async function load(slug: string) {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'articles',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  const article = res.docs[0] as Article | undefined
  if (!article) return undefined
  // Drafts are shown only to team members signed in to /admin, as a preview.
  if (article.status !== 'published' && !(await isTeamMember())) return undefined
  return article
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = await load((await params).slug)
  if (!a) return {}
  return a.status === 'published'
    ? { title: a.title, description: a.dek }
    : { title: `Draft preview: ${a.title}`, robots: { index: false, follow: false } }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await load(slug)
  if (!article) notFound()

  const payload = await getClient()
  const learner = await getLearner()
  const progress = await getProgress(learner)

  const pathRes = await payload.find({ collection: 'paths', where: { articles: { contains: article.id } }, limit: 1, depth: 1 })
  const path = pathRes.docs[0]
  const steps = ((path?.articles || []) as Article[]).filter((a) => typeof a === 'object' && a.status === 'published')
  const at = steps.findIndex((a) => a.id === article.id)
  const prev = at > 0 ? steps[at - 1] : undefined
  const next = at >= 0 && at < steps.length - 1 ? steps[at + 1] : undefined
  const readCount = steps.filter((a) => progress.read.has(a.id)).length
  const windowStart = Math.max(0, Math.min(at - 2, steps.length - 4))
  const windowSteps = steps.slice(windowStart, windowStart + 4)

  const author = article.author && typeof article.author === 'object' ? (article.author as User) : null
  const headings = (article.body || []).filter((b) => b.blockType === 'heading') as { text: string }[]
  const hasQuiz = (article.quiz || []).length > 0
  const saved = progress.saved.has(article.id)
  const here = `/articles/${article.slug}`
  const isDraft = article.status !== 'published'
  const published = formatDate(article.publishedAt)
  const updated = formatDate(article.updatedAt)

  return (
    <div className="page page--article">
      <Header learner={learner} active="articles" />
      <ScrollProgress />
      {isDraft && (
        <div className="draft-bar" role="status">
          <div className="wrap draft-bar__in">
            <span><strong>Draft preview.</strong> Only signed-in team members can see this page. Readers cannot.</span>
            <a href={`/admin/collections/articles/${article.id}`}>Edit or publish</a>
          </div>
        </div>
      )}
      <main className="wrap article-main">
        <div className="article-head">
          <nav aria-label="Breadcrumb" className="crumbs">
            <Link href="/learning-paths">Learning paths</Link>
            {path && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/learning-paths#${path.slug}`}>{path.title}</Link>
                <span aria-hidden="true">/</span>
                <span>Article {at + 1} of {steps.length}</span>
              </>
            )}
          </nav>
          <div className="meta">
            <span>{topicName(article)}</span>
            <span>{levelLabel(article.level)}</span>
            {article.readMinutes ? <span>{article.readMinutes} min read</span> : null}
          </div>
          <h1>{article.title}</h1>
          {article.dek && <p className="dek">{article.dek}</p>}
          <div className="byline">
            <div className="byline__who">
              {author?.name && <span aria-hidden="true" className="avatar">{initials(author.name)}</span>}
              <span className="byline__text">
                {author?.name && <span className="byline__name">{author.name}</span>}
                <span className="byline__date">{published ? `${published}${updated && updated !== published ? ` · Updated ${updated}` : ''}` : `Updated ${updated}`}</span>
              </span>
            </div>
            <div className="byline__actions">
              <form action={toggleSave}>
                <input type="hidden" name="articleId" value={article.id} />
                <input type="hidden" name="saved" value={String(saved)} />
                <input type="hidden" name="path" value={here} />
                <button type="submit" className="btn btn--ghost" aria-pressed={saved}>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6"><path d="M4 2h8v12l-4-3-4 3z" /></svg>
                  <span>{saved ? 'Saved' : 'Save'}</span>
                </button>
              </form>
              <ShareButton title={article.title} />
            </div>
          </div>
          {(article.cover || []).length > 0 && <div className="article-cover"><Cover cover={article.cover} size="phone" /></div>}
        </div>

        <div className="article-cols">
          <article className="article-body">
            <Body blocks={article.body || []} />
            {hasQuiz && <Quiz questions={article.quiz!} />}
            <ReadTracker articleId={article.id} enabled={Boolean(learner)} />
            {(prev || next) && (
              <nav aria-label="Path navigation" className="prev-next">
                {prev ? (
                  <Link href={`/articles/${prev.slug}`} className="prev-next__prev">
                    <span>Previous in path</span>
                    <strong>{prev.title}</strong>
                  </Link>
                ) : <span />}
                {next && (
                  <Link href={`/articles/${next.slug}`} className="prev-next__next">
                    <span>Next in path</span>
                    <strong>{next.title}</strong>
                  </Link>
                )}
              </nav>
            )}
          </article>

          <aside className="article-aside" id="contents">
            {(headings.length > 0 || hasQuiz) && (
              <nav aria-labelledby="toc-h" className="toc">
                <h2 id="toc-h" className="eyebrow">On this page</h2>
                {headings.map((h, i) => (
                  <a key={i} href={`#${slugify(h.text)}`} className={i === 0 ? 'is-current' : undefined}>{h.text}</a>
                ))}
                {hasQuiz && <a href="#quiz-h">Check your understanding</a>}
              </nav>
            )}
            {path && (
              <section aria-labelledby="path-h" className="path-panel">
                <h2 id="path-h" className="eyebrow">Your path · {path.title}</h2>
                {learner ? (
                  <div className="progress">
                    <div role="img" aria-label={`${readCount} of ${steps.length} articles read`} className="progress__bar"><div style={{ width: `${Math.round((readCount / steps.length) * 100)}%` }} /></div>
                    <span>{readCount} of {steps.length} articles read</span>
                  </div>
                ) : (
                  <p className="path-panel__signin"><Link href={`/sign-in?next=${encodeURIComponent(here)}`}>Sign in</Link> to track your progress through this path.</p>
                )}
                <ol>
                  {windowSteps.map((a, i) => {
                    const n = String(windowStart + i + 1).padStart(2, '0')
                    const current = a.id === article.id
                    const read = progress.read.has(a.id)
                    return (
                      <li key={a.id} className={current ? 'is-current' : read ? 'is-read' : undefined}>
                        <span className="num">{n}</span>
                        <span>
                          {current ? (a.shortTitle || a.title) : <Link href={`/articles/${a.slug}`}>{a.shortTitle || a.title}</Link>}
                          {current ? ' · Reading now' : read ? ' · Read' : ''}
                        </span>
                      </li>
                    )
                  })}
                </ol>
                <Link href={`/learning-paths#${path.slug}`} className="more-link">View the full path</Link>
              </section>
            )}
          </aside>
        </div>
      </main>
      <Footer />

      <nav aria-label="Article actions" className="phone-bar">
        <a href="#contents" className="phone-bar__btn">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 4h12M3 9h8M3 14h10" /></svg>
          <span>Contents</span>
        </a>
        <form action={toggleSave}>
          <input type="hidden" name="articleId" value={article.id} />
          <input type="hidden" name="saved" value={String(saved)} />
          <input type="hidden" name="path" value={here} />
          <button type="submit" className="phone-bar__btn" aria-pressed={saved}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 16 16" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6"><path d="M4 2h8v12l-4-3-4 3z" /></svg>
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
        </form>
        {next && (
          <Link href={`/articles/${next.slug}`} className="btn btn--accent phone-bar__next">
            <span>Next article</span>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 3l4 4-4 4" /></svg>
          </Link>
        )}
      </nav>
    </div>
  )
}
