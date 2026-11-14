/** Google sign-in settings, read from environment variables. */
// Values are trimmed because a stray space or line break from copy-and-paste makes Google reject them.
export const googleClientId = () => (process.env.GOOGLE_CLIENT_ID || '').trim()
export const googleClientSecret = () => (process.env.GOOGLE_CLIENT_SECRET || '').trim()
export const googleEnabled = () => Boolean(googleClientId() && googleClientSecret())

/** Comma-separated list of Google addresses allowed to sign in to /admin. Empty means nobody. */
export const adminEmails = () =>
  (process.env.GOOGLE_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

export const adminGoogleEnabled = () => googleEnabled() && adminEmails().length > 0

/** Must match the redirect address registered in Google Cloud exactly. */
export const redirectUri = (req: Request) => {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, '')
  return `${base}/auth/google/callback`
}

export const STATE_COOKIE = 'g_oauth_state'

export const safeNext = (v: string | null | undefined, fallback: string) =>
  v && v.startsWith('/') && !v.startsWith('//') ? v : fallback
