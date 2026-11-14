import type { Article } from '@/payload-types'

/** The box-and-line diagram used as an article cover. */
export function Cover({ cover, size = 'card' }: { cover: Article['cover']; size?: 'card' | 'hero' | 'phone' }) {
  const cols = cover || []
  return (
    <div aria-hidden="true" className={`cover cover--${size}`}>
      {cols.map((col, i) => (
        <span key={col.id || i} className="cover__col-wrap">
          {i > 0 && <span className="cover__line" />}
          {(col.items || []).length > 1 ? (
            <span className="cover__stack">
              {(col.items || []).map((it, j) => (
                <span key={it.id || j} className={`cover__box cover__box--${it.style || 'plain'}`}>{it.label}</span>
              ))}
            </span>
          ) : (
            (col.items || []).map((it, j) => (
              <span key={it.id || j} className={`cover__box cover__box--${it.style || 'plain'}`}>{it.label}</span>
            ))
          )}
        </span>
      ))}
    </div>
  )
}
