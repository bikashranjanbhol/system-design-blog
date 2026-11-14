import Link from 'next/link'
import type { Learner } from '@/payload-types'
import { signOut } from '@/app/(frontend)/actions'

const Mark = ({ size = 26 }: { size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="9" height="9" rx="2" />
    <rect x="15" y="15" width="9" height="9" rx="2" />
    <path d="M11 6.5h6.5V15" />
  </svg>
)

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'System Design Notes'

type Active = 'articles' | 'paths' | 'topics' | null

export function Header({ learner, active = null, minimal = false }: { learner: Learner | null; active?: Active; minimal?: boolean }) {
  const links = (
    <>
      <Link href="/" className={active === 'articles' ? 'is-active' : undefined}>Articles</Link>
      <Link href="/learning-paths" className={active === 'paths' ? 'is-active' : undefined}>Learning paths</Link>
      <Link href="/learning-paths#topics" className={active === 'topics' ? 'is-active' : undefined}>Topics</Link>
      <Link href="/#about">About</Link>
    </>
  )
  return (
    <header className="site-header">
      <div className="wrap site-header__in">
        <Link href="/" className="brand">
          <Mark />
          <span>{SITE_NAME}</span>
        </Link>
        {minimal ? (
          <Link href="/" className="back-link">Back to articles</Link>
        ) : (
          <>
            <nav aria-label="Main" className="main-nav">{links}</nav>
            <div className="auth">
              {learner ? (
                <>
                  <span className="auth__who">{learner.name || learner.email}</span>
                  <form action={signOut}>
                    <button type="submit" className="auth__link">Sign out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/sign-in" className="auth__link">Sign in</Link>
                  <Link href="/create-account" className="btn btn--accent">Subscribe</Link>
                </>
              )}
            </div>
            <div className="mobile-actions">
              <Link href="/#search" className="icon-btn" aria-label="Search">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="9" r="6" /><path d="M13.5 13.5L18 18" /></svg>
              </Link>
              <details className="mobile-menu">
                <summary className="icon-btn" aria-label="Open menu">
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h14M3 10h14M3 14h14" /></svg>
                </summary>
                <nav aria-label="Menu" className="mobile-menu__panel">
                  {links}
                  {learner ? (
                    <form action={signOut}><button type="submit">Sign out</button></form>
                  ) : (
                    <>
                      <Link href="/sign-in">Sign in</Link>
                      <Link href="/create-account">Subscribe</Link>
                    </>
                  )}
                </nav>
              </details>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

export function Footer({ minimal = false }: { minimal?: boolean }) {
  return (
    <footer className="site-footer" id="about">
      <div className={`wrap site-footer__in${minimal ? ' site-footer__in--minimal' : ''}`}>
        <span className="site-footer__name">{SITE_NAME}</span>
        <nav aria-label="Footer">
          {minimal ? (
            <>
              <Link href="/#privacy">Privacy</Link>
              <Link href="/#terms">Terms</Link>
            </>
          ) : (
            <>
              <Link href="/">Articles</Link>
              <Link href="/learning-paths">Learning paths</Link>
              <Link href="/#about">About</Link>
              <Link href="/feed.xml">RSS</Link>
            </>
          )}
        </nav>
      </div>
    </footer>
  )
}
