import type { CollectionConfig } from 'payload'
import { isAdmin } from './access'

// Readers who sign in on the site to keep their place. They never use the admin panel.
export const Learners: CollectionConfig = {
  slug: 'learners',
  admin: { useAsTitle: 'email', group: 'People' },
  auth: { tokenExpiration: 60 * 60 * 24 * 30 },
  access: {
    create: () => true,
    read: ({ req }) => {
      if (req.user?.collection === 'users') return true
      if (req.user?.collection === 'learners') return { id: { equals: req.user.id } }
      return false
    },
    update: ({ req }) => {
      if (req.user?.collection === 'users') return true
      if (req.user?.collection === 'learners') return { id: { equals: req.user.id } }
      return false
    },
    delete: isAdmin,
  },
  fields: [{ name: 'name', type: 'text' }],
}
