import type { CollectionConfig } from 'payload'

// Your team: the people who write and publish articles in the admin panel.
export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email', group: 'People' },
  auth: true,
  fields: [{ name: 'name', type: 'text', required: true }],
}
