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

/** Highlights the section being read in the "On this page" list and keeps that link in view. */
export function TocSpy() {
  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.toc a[href^="#"]'))
    const targets = links
      .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
      .filter((el): el is HTMLElement => Boolean(el))
    if (!targets.length) return
    let current = -1
    const update = () => {
      // The current section is the last heading that has passed the top quarter of the window.
      const line = window.innerHeight * 0.25
      let at = 0
      targets.forEach((el, i) => {
        if (el.getBoundingClientRect().top <= line) at = i
      })
      if (at === current) return
      current = at
      const id = targets[at]!.id
      links.forEach((a) => {
        const on = decodeURIComponent(a.hash.slice(1)) === id
        a.classList.toggle('is-current', on)
        if (on) a.setAttribute('aria-current', 'location')
        else a.removeAttribute('aria-current')
        const box = a.closest<HTMLElement>('.article-aside')
        if (on && box && box.scrollHeight > box.clientHeight) {
          const top = a.offsetTop - box.offsetTop
          if (top < box.scrollTop + 40 || top + a.offsetHeight > box.scrollTop + box.clientHeight - 40)
            box.scrollTo({ top: top - box.clientHeight / 2, behavior: 'smooth' })
        }
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return null
}
