import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import type { Article, Learner } from '@/payload-types'

export const getClient = () => getPayload({ config })

/** The signed-in learner, or null. Team members signed in to /admin do not count. */
export async function getLearner(): Promise<Learner | null> {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await headers() })
  return user && user.collection === 'learners' ? (user as Learner) : null
}

/** True when the visitor is signed in to /admin as a team member. */
export async function isTeamMember(): Promise<boolean> {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await headers() })
  return Boolean(user && user.collection === 'users')
}

export type ProgressSets = { read: Set<number>; saved: Set<number> }

export async function getProgress(learner: Learner | null): Promise<ProgressSets> {
  const sets: ProgressSets = { read: new Set(), saved: new Set() }
  if (!learner) return sets
  const payload = await getClient()
  const res = await payload.find({
    collection: 'progress',
    where: { learner: { equals: learner.id } },
    depth: 0,
    limit: 1000,
  })
  for (const row of res.docs) {
    const id = typeof row.article === 'object' ? row.article.id : row.article
    if (row.read) sets.read.add(id)
    if (row.saved) sets.saved.add(id)
  }
  return sets
}

export const levelLabel = (l?: Article['level'] | null) =>
  l === 'advanced' ? 'Advanced' : l === 'intermediate' ? 'Intermediate' : 'Beginner'

export const topicName = (a: Article) => (a.topic && typeof a.topic === 'object' ? a.topic.name : '')

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''

export const initials = (name?: string | null) =>
  (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
