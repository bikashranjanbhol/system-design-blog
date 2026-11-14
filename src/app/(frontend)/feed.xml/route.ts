import { getClient } from '@/lib/data'
import { SITE_NAME } from '@/components/Chrome'

export const dynamic = 'force-dynamic'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function GET(req: Request) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
  const payload = await getClient()
  const res = await payload.find({ collection: 'articles', where: { status: { equals: 'published' } }, sort: '-publishedAt', limit: 30, depth: 0 })
  const items = res.docs
    .map((a) => `<item><title>${esc(a.title)}</title><link>${origin}/articles/${a.slug}</link><guid>${origin}/articles/${a.slug}</guid>${a.publishedAt ? `<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : ''}<description>${esc(a.dek || '')}</description></item>`)
    .join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(SITE_NAME)}</title><link>${origin}</link><description>Articles on system design</description>${items}</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
