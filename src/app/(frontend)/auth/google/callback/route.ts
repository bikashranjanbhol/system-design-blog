import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getClient } from '@/lib/data'
import { STATE_COOKIE, adminEmails, googleClientId, googleClientSecret, googleEnabled, redirectUri } from '@/lib/google'
import { startSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

type GoogleUser = { sub?: string; email?: string; email_verified?: boolean; name?: string }

// Step 2: Google sends the visitor back here with a one-time code.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const origin = url.origin
  const problem = (reason: string) => NextResponse.redirect(`${origin}/auth/problem?reason=${reason}`)

  if (!googleEnabled()) return problem('off')

  const jar = await cookies()
  const raw = jar.get(STATE_COOKIE)?.value
  jar.delete(STATE_COOKIE)
  let saved: { state?: string; as?: string; next?: string } = {}
  try {
    saved = raw ? JSON.parse(raw) : {}
  } catch {
    saved = {}
  }

  const code = url.searchParams.get('code')
  if (url.searchParams.get('error')) return problem('cancelled')
  if (!code || !saved.state || saved.state !== url.searchParams.get('state')) return problem('expired')

  // Exchange the code for an access token, then ask Google who this is.
  let profile: GoogleUser
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId(),
        client_secret: googleClientSecret(),
        redirect_uri: redirectUri(req),
        grant_type: 'authorization_code',
      }),
    })
    if (!tokenRes.ok) {
      // Google's reply names the cause (for example invalid_client) and contains no secrets.
      console.error('[google sign-in] token exchange failed', tokenRes.status, await tokenRes.text())
      return problem('google')
    }
    const { access_token } = (await tokenRes.json()) as { access_token?: string }
    if (!access_token) {
      console.error('[google sign-in] token reply had no access token')
      return problem('google')
    }
    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!infoRes.ok) {
      console.error('[google sign-in] profile request failed', infoRes.status, await infoRes.text())
      return problem('google')
    }
    profile = (await infoRes.json()) as GoogleUser
  } catch (err) {
    console.error('[google sign-in] request to Google failed', err)
    return problem('google')
  }

  const email = (profile.email || '').trim().toLowerCase()
  if (!email || profile.email_verified !== true) return problem('unverified')

  const payload = await getClient()
  const isAdmin = saved.as === 'admin'
  const collection = isAdmin ? 'users' : 'learners'

  if (isAdmin && !adminEmails().includes(email)) return problem('not-admin')

  const found = await payload.find({ collection, where: { email: { equals: email } }, limit: 1, depth: 0 })
  let id = found.docs[0]?.id
  if (!id) {
    // First visit: create the account. The random password is never shown; Google is how they sign in.
    const created = await payload.create({
      collection,
      data: { email, name: profile.name || email.split('@')[0], password: randomBytes(32).toString('hex') },
    })
    id = created.id
  }

  await startSession(collection, id)
  return NextResponse.redirect(`${origin}${saved.next || (isAdmin ? '/admin' : '/learning-paths')}`)
}
