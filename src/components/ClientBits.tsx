'use client'

import { useEffect, useRef, useState } from 'react'
import { markRead } from '@/app/(frontend)/actions'

/** Marks the article as read once a signed-in learner scrolls to the end of it. */
export function ReadTracker({ articleId, enabled }: { articleId: number; enabled: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!enabled || !ref.current) return
    let done = false
    const io = new IntersectionObserver((entries) => {
      if (!done && entries.some((e) => e.isIntersecting)) {
        done = true
        void markRead(articleId)
        io.disconnect()
      }
    })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [articleId, enabled])
  return <span ref={ref} aria-hidden="true" />
}

/** Thin bar at the top of the article on phones showing how far down the page you are. */
export function ScrollProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setPct(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <div className="scroll-progress" role="img" aria-label={`Reading progress: ${pct} percent`}>
      <div style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title, url }) } catch { /* cancelled */ }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }
  return (
    <button type="button" className="btn btn--ghost" onClick={share}>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 10V2M5 5l3-3 3 3M3 9v5h10V9" /></svg>
      <span>{copied ? 'Link copied' : 'Share'}</span>
    </button>
  )
}
