import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { Footer, Header, SITE_NAME } from '@/components/Chrome'
import { adminGoogleEnabled } from '@/lib/google'
import { CODE_TTL, resolveClient, sign } from '@/lib/oauth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Connect an assistant' }

type Params = {
  response_type?: string
  client_id?: string
  redirect_uri?: string
  state?: string
  code_challenge?: string
  code_challenge_method?: string
  scope?: string
  resource?: string
}

async function currentAdmin() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return user && user.collection === 'users' ? user : null
}

/** Checks the request the same way on first view and again when a button is pressed. */
async function check(p: Params) {
  if (p.response_type !== 'code') return { error: 'This connection request is not in a supported form.' as const }
  const client = await resolveClient(p.client_id || '')
  if (!client) return { error: 'The assistant that is asking to connect could not be identified.' as const }
  if (!p.redirect_uri || !client.redirectUris.includes(p.redirect_uri)) {
    return { error: 'The return address in this request does not match the assistant that is asking to connect.' as const }
  }
  if (!p.code_challenge || p.code_challenge_method !== 'S256') {
    return { error: 'This connection request is missing a required security check.' as const }
  }
  return { client, redirectUri: p.redirect_uri, challenge: p.code_challenge }
}

async function decide(form: FormData) {
  'use server'
  const p = Object.fromEntries(form.entries()) as Params & { decision?: string }
  const admin = await currentAdmin()
  const ok = await check(p)
  if (!admin || 'error' in ok) redirect('/auth/problem?reason=expired')

  const back = new URL(ok.redirectUri)
  if (p.state) back.searchParams.set('state', p.state)
  if (p.decision !== 'allow') {
    back.searchParams.set('error', 'access_denied')
    redirect(back.toString())
  }
  const code = await sign(
    'code',
    { sub: String(admin.id), cid: ok.client.clientId, ru: ok.redirectUri, cc: ok.challenge, ...(p.resource ? { res: p.resource } : {}) },
    CODE_TTL,
  )
  back.searchParams.set('code', code)
  redirect(back.toString())
}

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams
  const admin = await currentAdmin()

  if (!admin) {
    // Sign in as an admin first, then come back to this exact request.
    const here = `/oauth/authorize?${new URLSearchParams(p as Record<string, string>)}`
    redirect(adminGoogleEnabled() ? `/auth/google?as=admin&next=${encodeURIComponent(here)}` : `/admin/login?redirect=${encodeURIComponent(here)}`)
  }

  const ok = await check(p)
  const fields = Object.entries(p).filter(([, v]) => typeof v === 'string') as [string, string][]

  return (
    <div className="page">
      <Header learner={null} minimal />
      <main className="wrap doc-main">
        <p className="eyebrow eyebrow--lg">Connect an assistant</p>
        {'error' in ok ? (
          <>
            <h1>This connection cannot continue</h1>
            <p className="lead">{ok.error}</p>
            <p>Nothing was connected. Start again from the assistant you were setting up.</p>
          </>
        ) : (
          <>
            <h1>Allow {ok.client.name} to work on {SITE_NAME}?</h1>
            <p className="lead">You are signed in as {admin.email}. If you allow this, the assistant acts with your admin account.</p>
            <h2>It will be able to</h2>
            <ul>
              <li>See topics, learning paths and articles, including drafts.</li>
              <li>Create new articles as drafts.</li>
              <li>Edit articles that are still drafts.</li>
            </ul>
            <h2>It will not be able to</h2>
            <ul>
              <li>Publish, unpublish or delete anything. Publishing stays with you in the editing panel.</li>
              <li>Change published articles, accounts or settings.</li>
            </ul>
            <p className="updated">After you choose, you return to <strong>{new URL(ok.redirectUri).host}</strong>. Only allow this if you started the connection yourself.</p>
            <form action={decide} className="consent-actions">
              {fields.map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              <button type="submit" name="decision" value="allow" className="btn btn--accent btn--lg">Allow</button>
              <button type="submit" name="decision" value="deny" className="btn btn--outline btn--lg">Cancel</button>
            </form>
          </>
        )}
      </main>
      <Footer minimal />
    </div>
  )
}
