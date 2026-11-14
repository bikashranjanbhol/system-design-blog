'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getClient, getLearner } from '@/lib/data'

const COOKIE = 'payload-token'
export type FormState = { error?: string; email?: string; name?: string } | undefined

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === 'string' ? v : ''
  return s.startsWith('/') && !s.startsWith('//') ? s : '/learning-paths'
}

async function setSession(token: string, keep: boolean) {
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    ...(keep ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  })
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get('email') || '').trim()
  const password = String(form.get('password') || '')
  if (!email || !password) return { error: 'Enter your email address and password.', email }
  const payload = await getClient()
  let token: string | undefined
  try {
    const res = await payload.login({ collection: 'learners', data: { email, password } })
    token = res.token
  } catch {
    return { error: 'That email and password do not match an account. Check both and try again.', email }
  }
  if (!token) return { error: 'Sign-in did not complete. Try again.', email }
  await setSession(token, form.get('keep') === 'on')
  redirect(safeNext(form.get('next')))
}

export async function createAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get('name') || '').trim()
  const email = String(form.get('email') || '').trim()
  const password = String(form.get('password') || '')
  if (!email || !password) return { error: 'Enter an email address and a password.', email, name }
  if (password.length < 8) return { error: 'Use a password of at least 8 characters.', email, name }
  const payload = await getClient()
  try {
    await payload.create({ collection: 'learners', data: { name, email, password } })
  } catch {
    return { error: 'An account could not be created with that email. If you already have one, sign in instead.', email, name }
  }
  const res = await payload.login({ collection: 'learners', data: { email, password } })
  if (res.token) await setSession(res.token, true)
  redirect(safeNext(form.get('next')))
}

export async function signOut() {
  const jar = await cookies()
  jar.delete(COOKIE)
  redirect('/')
}

async function upsert(articleId: number, patch: { read?: boolean; saved?: boolean }) {
  const learner = await getLearner()
  if (!learner) return null
  const payload = await getClient()
  const found = await payload.find({
    collection: 'progress',
    where: { and: [{ learner: { equals: learner.id } }, { article: { equals: articleId } }] },
    limit: 1,
    depth: 0,
  })
  const row = found.docs[0]
  if (row) {
    return payload.update({ collection: 'progress', id: row.id, data: patch })
  }
  return payload.create({
    collection: 'progress',
    data: { learner: learner.id, article: articleId, read: patch.read ?? false, saved: patch.saved ?? false },
  })
}

/** Called when a signed-in learner reaches the end of an article. */
export async function markRead(articleId: number) {
  await upsert(articleId, { read: true })
  revalidatePath('/learning-paths')
}

export async function toggleSave(form: FormData) {
  const articleId = Number(form.get('articleId'))
  const saved = form.get('saved') === 'true'
  const path = String(form.get('path') || '/')
  const learner = await getLearner()
  if (!learner) redirect(`/sign-in?next=${encodeURIComponent(path)}`)
  await upsert(articleId, { saved: !saved })
  revalidatePath(path)
}
