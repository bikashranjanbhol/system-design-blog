/**
 * A small OAuth 2.1 authorization server for the blog's AI connector.
 *
 * It is stateless: client registrations, one-time codes and tokens are all signed
 * with PAYLOAD_SECRET, so no extra database tables are needed. Only people who can
 * sign in to /admin can approve a connection.
 */
import { createHash } from 'crypto'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export const SCOPE = 'articles:draft'
export const ACCESS_TTL = 60 * 60 // 1 hour
export const REFRESH_TTL = 60 * 60 * 24 * 30 // 30 days
export const CODE_TTL = 120 // 2 minutes

const key = () => {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set')
  // A derived key, so connector tokens can never be mistaken for Payload sign-in tokens.
  return createHash('sha256').update(`mcp-connector:${secret}`).digest()
}

export const siteOrigin = (req?: Request) =>
  (process.env.NEXT_PUBLIC_SITE_URL || (req ? new URL(req.url).origin : '')).replace(/\/$/, '')

type Kind = 'client' | 'code' | 'access' | 'refresh'

export async function sign(kind: Kind, claims: JWTPayload, ttlSeconds?: number) {
  const jwt = new SignJWT({ ...claims, typ: `mcp-${kind}` }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt()
  if (ttlSeconds) jwt.setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
  return jwt.sign(key())
}

export async function verify<T extends JWTPayload>(kind: Kind, token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] })
    return payload.typ === `mcp-${kind}` ? (payload as T) : null
  } catch {
    return null
  }
}

export type Client = { clientId: string; name: string; redirectUris: string[] }

const isHttpsUrl = (s: string) => {
  try {
    return new URL(s).protocol === 'https:'
  } catch {
    return false
  }
}

const isLoopback = (s: string) => {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)
  } catch {
    return false
  }
}

export const validRedirectUri = (s: string) => isHttpsUrl(s) || isLoopback(s)

/** Private and internal hosts are refused when fetching a client's metadata document. */
const publicHost = (host: string) =>
  !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[|0\.)/.test(host) && host.includes('.')

/**
 * Looks up who is asking to connect. Two kinds of client_id are accepted:
 * - one issued by /oauth/register (a signed record of the client's details), or
 * - an https URL that serves the client's metadata document.
 */
export async function resolveClient(clientId: string): Promise<Client | null> {
  if (!clientId) return null
  if (clientId.startsWith('https://')) {
    try {
      const url = new URL(clientId)
      if (!publicHost(url.hostname)) return null
      const res = await fetch(url, { headers: { Accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(5000) })
      if (!res.ok) return null
      const text = await res.text()
      if (text.length > 20000) return null
      const doc = JSON.parse(text) as { client_id?: string; client_name?: string; redirect_uris?: unknown }
      if (doc.client_id !== clientId || !Array.isArray(doc.redirect_uris)) return null
      const redirectUris = doc.redirect_uris.filter((u): u is string => typeof u === 'string' && validRedirectUri(u))
      if (!redirectUris.length) return null
      return { clientId, name: String(doc.client_name || url.hostname).slice(0, 80), redirectUris }
    } catch {
      return null
    }
  }
  const rec = await verify<{ name?: string; redirect_uris?: string[] }>('client', clientId)
  if (!rec || !Array.isArray(rec.redirect_uris)) return null
  return { clientId, name: String(rec.name || 'An AI assistant').slice(0, 80), redirectUris: rec.redirect_uris }
}

export const pkceMatches = (verifier: string, challenge: string) =>
  createHash('sha256').update(verifier).digest('base64url') === challenge

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors },
  })

export const preflight = () => new Response(null, { status: 204, headers: cors })
