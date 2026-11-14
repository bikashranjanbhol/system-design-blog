'use client'

import { useEffect, useRef } from 'react'
import type { Article } from '@/payload-types'

/**
 * The box-and-line diagram used as an article cover.
 * A diagram that is wider than its frame (many boxes, long labels) is scaled down to fit.
 */
export function Cover({ cover, size = 'card' }: { cover: Article['cover']; size?: 'card' | 'hero' | 'phone' }) {
  const cols = cover || []
  const frame = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const box = frame.current
    const row = inner.current
    if (!box || !row) return
    const fit = () => {
      const room = box.clientWidth - 24
      const scale = row.offsetWidth > room && room > 0 ? room / row.offsetWidth : 1
      row.style.transform = scale < 1 ? `scale(${scale})` : ''
    }
    fit()
    const watcher = new ResizeObserver(fit)
    watcher.observe(box)
    document.fonts?.ready.then(fit)
    return () => watcher.disconnect()
  }, [cover])

  return (
    <div aria-hidden="true" className={`cover cover--${size}`} ref={frame}>
      <span className="cover__row" ref={inner}>
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
      </span>
    </div>
  )
}
