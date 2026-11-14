import Link from 'next/link'
import type { Article } from '@/payload-types'
import { getClient, getLearner, getProgress, levelLabel } from '@/lib/data'
import { Footer, Header } from '@/components/Chrome'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Learning paths' }

export default async function PathsPage() {
  const payload = await getClient()
  const learner = await getLearner()
  const progress = await getProgress(learner)
  const [pathsRes, topicsRes] = await Promise.all([
    payload.find({ collection: 'paths', sort: 'order', depth: 1, limit: 50 }),
    payload.find({ collection: 'topics', where: { inGrid: { equals: true } }, sort: 'order', limit: 100 }),
  ])

  const paths = pathsRes.docs.map((p) => {
    const steps = ((p.articles || []) as Article[]).filter((a) => typeof a === 'object' && a.status === 'published')
    const read = steps.filter((a) => progress.read.has(a.id)).length
    const nextIndex = steps.findIndex((a) => !progress.read.has(a.id))
    return { p, steps, read, nextIndex }
  })
  // Open the first path the learner has started but not finished; otherwise the first path.
  const openIndex = Math.max(0, paths.findIndex((x) => x.read > 0 && x.read < x.steps.length))

  return (
    <div className="page">
      <Header learner={learner} active="paths" />
      <main className="wrap paths-main">
        <div className="page-head">
          <p className="eyebrow eyebrow--lg">Learning paths</p>
          <h1>Read in an order that makes sense.</h1>
          <p className="lead">
            Each path is a short sequence of articles. {learner ? 'Your place is saved as you read.' : 'Sign in to keep your place; reading is open to everyone.'}
          </p>
        </div>

        <div className="paths">
          {paths.map(({ p, steps, read, nextIndex }, i) => {
            const label = `Path ${String(i + 1).padStart(2, '0')} · ${levelLabel(p.level)} · ${steps.length} articles`
            const list = (
              <ol className="steps">
                {steps.map((a, j) => {
                  const isRead = progress.read.has(a.id)
                  const isNext = Boolean(learner) && j === nextIndex
                  return (
                    <li key={a.id} className={isNext ? 'is-next' : undefined}>
                      <Link href={`/articles/${a.slug}`}>
                        <span className="steps__num">{String(j + 1).padStart(2, '0')}</span>
                        <span className="steps__title">{a.title}</span>
                        <span className="steps__min">{a.readMinutes ? `${a.readMinutes} min` : ''}</span>
                        {learner && <span className={`steps__status${isRead ? ' is-read' : ''}`}>{isRead ? 'Read' : isNext ? 'Next up' : 'Not started'}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ol>
            )
            if (i === openIndex) {
              const nextStep = nextIndex >= 0 ? steps[nextIndex] : undefined
              return (
                <section key={p.id} id={p.slug} aria-labelledby={`p-${p.id}`} className="path path--open">
                  <div className="path__head">
                    <div className="path__intro">
                      <span className="eyebrow">{label}</span>
                      <h2 id={`p-${p.id}`}>{p.title}</h2>
                      <p>{p.description}</p>
                    </div>
                    <div className="path__progress">
                      {learner ? (
                        <>
                          <div role="img" aria-label={`${read} of ${steps.length} articles read`} className="progress__bar"><div style={{ width: `${Math.round((read / Math.max(1, steps.length)) * 100)}%` }} /></div>
                          <span className="path__count">{read} of {steps.length} read</span>
                          {nextStep ? (
                            <Link href={`/articles/${nextStep.slug}`} className="btn btn--accent btn--lg">{read === 0 ? 'Start with article 1' : `Continue with article ${nextIndex + 1}`}</Link>
                          ) : (
                            <span className="path__count">Path complete</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="path__count">Sign in to track which articles you have read.</span>
                          <Link href="/sign-in?next=/learning-paths" className="btn btn--accent btn--lg">Sign in to track progress</Link>
                        </>
                      )}
                    </div>
                  </div>
                  {list}
                </section>
              )
            }
            return (
              <details key={p.id} id={p.slug} className="path path--closed">
                <summary>
                  <div className="path__intro">
                    <span className="eyebrow">{label}</span>
                    <h2>{p.title}</h2>
                    <p>{p.description}</p>
                  </div>
                  <span className="btn btn--outline btn--lg path__toggle">
                    <span className="when-closed">Show {steps.length} articles</span>
                    <span className="when-open">Hide articles</span>
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 5l4 4 4-4" /></svg>
                  </span>
                </summary>
                {list}
              </details>
            )
          })}
        </div>

        <section id="topics" aria-labelledby="topics-h" className="topics">
          <div className="topics__head">
            <h2 id="topics-h">Browse by topic</h2>
            <p>Looking for one thing? Jump straight to it.</p>
          </div>
          <div className="topic-grid">
            {topicsRes.docs.map((t) => (
              <Link key={t.id} href={`/?topic=${t.slug}#latest`} className="topic-card">
                <span className="topic-card__name">{t.name}</span>
                <span className="topic-card__desc">{t.description}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
