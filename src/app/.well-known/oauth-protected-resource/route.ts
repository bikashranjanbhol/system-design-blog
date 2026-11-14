import { SCOPE, json, preflight, siteOrigin } from '@/lib/oauth'

export const dynamic = 'force-dynamic'

// Tells an AI client which server signs people in for the connector at /mcp.
export function GET(req: Request) {
  const origin = siteOrigin(req)
  return json({
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ['header'],
  })
}
export const OPTIONS = preflight
