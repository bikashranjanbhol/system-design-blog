import { SCOPE, json, preflight, siteOrigin } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

export function GET(req: Request) {
  const origin = siteOrigin(req)
  return json({
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: [SCOPE],
    client_id_metadata_document_supported: true,
  })
}
export const OPTIONS = preflight
