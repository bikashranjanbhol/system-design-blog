import { getClient } from '@/lib/data'
import { ACCESS_TTL, REFRESH_TTL, SCOPE, json, pkceMatches, preflight, sign, verify } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

const fail = (error: string, description: string, status = 400) => json({ error, error_description: description }, status)

async function adminExists(id: string | number) {
  const payload = await getClient()
  try {
    await payload.findByID({ collection: 'users', id, depth: 0 })
    return true
  } catch {
    return false
  }
}

async function issue(sub: string, clientId: string, resource?: string) {
  const claims = { sub, cid: clientId, scope: SCOPE, ...(resource ? { aud: resource } : {}) }
  return json({
    access_token: await sign('access', claims, ACCESS_TTL),
    token_type: 'Bearer',
    expires_in: ACCESS_TTL,
    refresh_token: await sign('refresh', claims, REFRESH_TTL),
    scope: SCOPE,
  })
}

export async function POST(req: Request) {
  let form: URLSearchParams
  try {
    const type = req.headers.get('content-type') || ''
    form = type.includes('application/json')
      ? new URLSearchParams(Object.entries((await req.json()) as Record<string, string>))
      : new URLSearchParams(await req.text())
  } catch {
    return fail('invalid_request', 'Could not read the request body.')
  }
  const grant = form.get('grant_type')
  const clientId = form.get('client_id') || ''

  if (grant === 'authorization_code') {
    const code = await verify<{ sub: string; cid: string; ru: string; cc: string; res?: string }>('code', form.get('code') || '')
    if (!code) return fail('invalid_grant', 'The code is invalid or has expired.')
    if (code.cid !== clientId) return fail('invalid_grant', 'The code was issued to a different client.')
    if (code.ru !== form.get('redirect_uri')) return fail('invalid_grant', 'redirect_uri does not match.')
    if (!pkceMatches(form.get('code_verifier') || '', code.cc)) return fail('invalid_grant', 'code_verifier does not match.')
    if (!(await adminExists(code.sub))) return fail('invalid_grant', 'The admin account no longer exists.')
    return issue(code.sub, clientId, code.res)
  }

  if (grant === 'refresh_token') {
    const rt = await verify<{ sub: string; cid: string; aud?: string }>('refresh', form.get('refresh_token') || '')
    if (!rt) return fail('invalid_grant', 'The refresh token is invalid or has expired.')
    if (rt.cid !== clientId) return fail('invalid_grant', 'The refresh token was issued to a different client.')
    if (!(await adminExists(rt.sub))) return fail('invalid_grant', 'The admin account no longer exists.')
    return issue(rt.sub, clientId, typeof rt.aud === 'string' ? rt.aud : undefined)
  }

  return fail('unsupported_grant_type', 'Use authorization_code or refresh_token.')
}
export const OPTIONS = preflight
