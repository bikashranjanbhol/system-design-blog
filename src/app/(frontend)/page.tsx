import Link from 'next/link'
import type { Where } from 'payload'
import type { Article } from '@/payload-types'
import { getClient, getLearner, levelLabel, topicName } from '@/lib/data'
import { Footer, Header } from '@/components/Chrome'
import { Cover } from '@/components/Cover'
import { ArticleCard } from '@/components/ArticleCard'

export const dynamic = 'force-dynamic'

type Search = { q?: string; topic?: string; show?: string }

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const { q = '', topic = '', show } = await searchParams
  const limit = Math.min(60, Math.max(6, Number(show) || 6))
  const payload = await getClient()
  const learner = await getLearner()

  const [featuredRes, pathsRes, topicsRes] = await Promise.all([
    payload.find({ collection: 'articles', where: { and: [{ status: { equals: 'published' } }, { featured: { equals: true } }] }, sort: '-publishedAt', limit: 1, depth: 1 }),
    payload.find({ collection: 'paths', sort: 'order', depth: 0, limit: 3 }),
    payload.find({ collection: 'topics', sort: 'order', limit: 100 }),
  ])
  const featured = featuredRes.docs[0] as Article | undefined
  const topics = topicsRes.docs
  const activeTopic = topics.find((t) => t.slug === topic)
  const filtering = Boolean(q || activeTopic)

  const and: Where[] = [{ status: { equals: 'published' } }]
  if (activeTopic) and.push({ topic: { equals: activeTopic.id } })
  if (q) and.push({ or: [{ title: { like: q } }, { dek: { like: q } }] })
  if (!filtering && featured) and.push({ id: { not_equals: featured.id } })
  const latest = await payload.find({ collection: 'articles', where: { and }, sort: '-publishedAt', limit, depth: 1 })

  const filterHref = (slug?: string) => (slug ? `/?topic=${slug}#latest` : '/#latest')

  return (
    <div className="page">
      <Header learner={learner} active="articles" />
      <main>
        <section className="hero-band">
          <div className="wrap hero">
            <div className="hero__text">
              <p className="eyebrow eyebrow--lg">A blog for learners of system design</p>
              <h1>Learn how real systems are put together, one diagram at a time.</h1>
              <p className="lead">Plain-language articles on load balancing, caching, databases and messaging, ordered so each one builds on the last.</p>
              <form role="search" action="/" className="search" id="search">
                <label htmlFor="q" className="sr-only">Search articles</label>
                <input id="q" name="q" type="search" defaultValue={q} placeholder="Search articles, e.g. consistent hashing" />
                <button type="submit" className="btn btn--dark btn--lg">Search</button>
              </form>
              <div className="chips">
                <span className="chips__label">Popular:</span>
                {topics.filter((t) => t.popular).map((t) => (
                  <Link key={t.id} href={filterHref(t.slug)} className="chip">{t.name}</Link>
                ))}
              </div>
            </div>
            {featured && (
              <Link href={`/articles/${featured.slug}`} className="featured">
                <Cover cover={featured.cover} size="hero" />
                <div className="featured__text">
                  <div className="meta">
                    <span className="meta__accent">Featured</span>
                    <span>{topicName(featured)}</span>
                    <span>{levelLabel(featured.level)}</span>
                    {featured.readMinutes ? <span>{featured.readMinutes} min read</span> : null}
                  </div>
                  <h2>{featured.title}</h2>
                  <p>{featured.dek}</p>
                </div>
              </Link>
            )}
          </div>
        </section>

        <section className="wrap section section--paths">
          <div className="section__head">
            <h2>Start with a learning path</h2>
            <Link href="/learning-paths" className="more-link">See all paths</Link>
          </div>
          <div className="path-cards">
            {pathsRes.docs.map((p, i) => (
              <Link key={p.id} href={`/learning-paths#${p.slug}`} className="path-card">
                <span className="eyebrow">Path {String(i + 1).padStart(2, '0')} · {levelLabel(p.level)}</span>
                <h3>{p.title}</h3>
                <p>{p.cardText}</p>
                <span className="path-card__count">{(p.articles || []).length} articles</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="wrap section section--latest" id="latest">
          <div className="section__head section__head--center">
            <h2>{q ? `Results for “${q}”` : 'Latest articles'}</h2>
            <div role="group" aria-label="Filter by topic" className="pills">
              <Link href={filterHref()} className={`pill${!activeTopic ? ' is-on' : ''}`} aria-current={!activeTopic ? 'true' : undefined}>All</Link>
              {topics.filter((t) => t.inFilter).map((t) => (
                <Link key={t.id} href={filterHref(t.slug)} className={`pill${activeTopic?.id === t.id ? ' is-on' : ''}`} aria-current={activeTopic?.id === t.id ? 'true' : undefined}>{t.name}</Link>
              ))}
            </div>
          </div>
          {latest.docs.length === 0 ? (
            <p className="empty">No articles match yet. Try another topic or search term.</p>
          ) : (
            <div className="grid">
              {latest.docs.map((a) => <ArticleCard key={a.id} article={a as Article} />)}
            </div>
          )}
          {latest.hasNextPage && (
            <div className="load-more">
              <Link href={`/?${new URLSearchParams({ ...(q ? { q } : {}), ...(topic ? { topic } : {}), show: String(limit + 6) })}#latest`} className="btn btn--outline btn--lg" scroll={false}>Load more articles</Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
