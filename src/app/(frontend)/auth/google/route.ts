import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { STATE_COOKIE, adminGoogleEnabled, googleClientId, googleEnabled, redirectUri, safeNext } from '@/lib/google'

export const dynamic = 'force-dynamic'

// Step 1: send the visitor to Google. ?as=learner (default) or ?as=admin
export async function GET(req: Request) {
  const url = new URL(req.url)
  const as = url.searchParams.get('as') === 'admin' ? 'admin' : 'learner'
  const origin = url.origin

  if (!googleEnabled() || (as === 'admin' && !adminGoogleEnabled())) {
    return NextResponse.redirect(`${origin}/auth/problem?reason=${as === 'admin' ? 'admin-off' : 'off'}`)
  }

  const next = safeNext(url.searchParams.get('next'), as === 'admin' ? '/admin' : '/learning-paths')
  const state = randomBytes(24).toString('hex')
  const jar = await cookies()
  jar.set(STATE_COOKIE, JSON.stringify({ state, as, next }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
  })

  const params = new URLSearchParams({
    client_id: googleClientId(),
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
