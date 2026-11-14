import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Article, Media } from '@/payload-types'
import { slugify } from '@/lib/data'

type Blocks = NonNullable<Article['body']>

export function Body({ blocks }: { blocks: Blocks }) {
  return (
    <>
      {blocks.map((b, i) => {
        const key = b.id || i
        switch (b.blockType) {
          case 'heading':
            return <h2 key={key} id={slugify(b.text)}>{b.text}</h2>
          case 'text':
            return <RichText key={key} data={b.content} className="prose" />
          case 'code':
            return <pre key={key} className="code"><code>{b.code}</code></pre>
          case 'callout':
            return (
              <div key={key} className="callout">
                <span className="callout__label">{b.label || 'Key takeaway'}</span>
                <p>{b.text}</p>
              </div>
            )
          case 'table':
            return (
              <div key={key} className="table-box">
                <table>
                  <thead>
                    <tr>{(b.headers || []).map((h, j) => <th key={h.id || j} scope="col">{h.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(b.rows || []).map((r, j) => (
                      <tr key={r.id || j}>
                        {(r.cells || []).map((c, k) =>
                          k === 0 ? <th key={c.id || k} scope="row">{c.value}</th> : <td key={c.id || k}>{c.value}</td>,
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'figure': {
            const img = b.image as Media
            return (
              <figure key={key} className="figure">
                {img?.url && <img src={img.url} alt={img.alt} width={img.width || undefined} height={img.height || undefined} />}
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            )
          }
          case 'lineDiagram':
            return (
              <figure key={key} className="figure">
                <div role="img" aria-label={b.alt} className="line-diagram">
                  <div className="line-diagram__axis" />
                  {b.startLabel && <span className="line-diagram__end line-diagram__end--start">{b.startLabel}</span>}
                  {b.endLabel && <span className="line-diagram__end line-diagram__end--finish">{b.endLabel}</span>}
                  {(b.markers || []).map((m, j) => (
                    <span key={m.id || j} className={`line-diagram__marker${m.highlight ? ' is-accent' : ''}`} style={{ left: `${m.position}%` }}>{m.label}</span>
                  ))}
                  {(b.points || []).map((p, j) => (
                    <span key={p.id || j}>
                      <span className={`line-diagram__point${p.highlight ? ' is-accent' : ''}`} style={{ left: `${p.position}%` }}>{p.label}</span>
                      <span className={`line-diagram__drop${p.highlight ? ' is-accent' : ''}`} style={{ left: `${p.position}%` }} />
                    </span>
                  ))}
                  {(b.notes || []).map((n, j) => (
                    <span key={n.id || j} className="line-diagram__note" style={{ left: `${n.position}%` }}>{n.text}</span>
                  ))}
                </div>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            )
          default:
            return null
        }
      })}
    </>
  )
}
