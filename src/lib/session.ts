import { cookies } from 'next/headers'
import { createLocalReq, getFieldsToSign, jwtSign } from 'payload'
import { addSessionToUser } from 'payload/shared'
import { getClient } from './data'

type AuthCollection = 'learners' | 'users'

/**
 * Signs a user in without a password (used after Google has confirmed who they are).
 * Mirrors what Payload's own login does: record a session, sign a token, set the cookie.
 */
export async function startSession(collection: AuthCollection, id: number | string) {
  const payload = await getClient()
  const collectionConfig = payload.collections[collection].config
  const req = await createLocalReq({}, payload)

  const user = await payload.db.findOne<Record<string, unknown> & { id: number | string; email: string }>({
    collection,
    where: { id: { equals: id } },
    req,
  })
  if (!user) throw new Error('Account not found')

  const { sid } = await addSessionToUser({ collectionConfig, payload, req, user: user as never })
  const fieldsToSign = getFieldsToSign({ collectionConfig, email: user.email, sid, user: user as never })
  const { token } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  const jar = await cookies()
  jar.set(`${payload.config.cookiePrefix}-token`, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: collectionConfig.auth.tokenExpiration,
  })
}
