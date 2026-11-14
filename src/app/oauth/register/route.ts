import { json, preflight, sign, validRedirectUri } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

// Dynamic client registration. Nothing is stored: the returned client_id is a signed
// record of the details the client gave. Registering grants no access by itself;
// an admin still has to sign in and approve the connection.
export async function POST(req: Request) {
  let body: { redirect_uris?: unknown; client_name?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_client_metadata', error_description: 'Body must be JSON.' }, 400)
  }
  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter((u): u is string => typeof u === 'string' && validRedirectUri(u)).slice(0, 10)
    : []
  if (!redirectUris.length) {
    return json({ error: 'invalid_redirect_uri', error_description: 'Provide at least one https redirect URI.' }, 400)
  }
  const name = typeof body.client_name === 'string' ? body.client_name.slice(0, 80) : 'An AI assistant'
  const clientId = await sign('client', { name, redirect_uris: redirectUris })
  return json(
    {
      client_id: clientId,
      client_name: name,
      redirect_uris: redirectUris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    },
    201,
  )
}
export const OPTIONS = preflight
