import type { Access, CollectionConfig } from 'payload'

const ownOrAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection === 'learners') return { learner: { equals: req.user.id } }
  return false
}

// One row per learner and article: whether they have read it and whether they saved it.
export const Progress: CollectionConfig = {
  slug: 'progress',
  admin: { group: 'People', defaultColumns: ['learner', 'article', 'read', 'saved'] },
  access: { read: ownOrAdmin, create: ownOrAdmin, update: ownOrAdmin, delete: ownOrAdmin },
  fields: [
    { name: 'learner', type: 'relationship', relationTo: 'learners', required: true, index: true },
    { name: 'article', type: 'relationship', relationTo: 'articles', required: true, index: true },
    { name: 'read', type: 'checkbox', defaultValue: false },
    { name: 'saved', type: 'checkbox', defaultValue: false },
  ],
}
