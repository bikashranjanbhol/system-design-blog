import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from './access'

export const Paths: CollectionConfig = {
  slug: 'paths',
  labels: { singular: 'Learning path', plural: 'Learning paths' },
  admin: { useAsTitle: 'title', group: 'Content', defaultColumns: ['title', 'level', 'order'] },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  defaultSort: 'order',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'level',
      type: 'select',
      required: true,
      defaultValue: 'beginner',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'cardText', type: 'textarea', admin: { description: 'Shown on the Home page card.' } },
    { name: 'description', type: 'textarea', admin: { description: 'Shown on the Learning paths page.' } },
    {
      name: 'articles',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      admin: { description: 'In reading order.' },
    },
  ],
}
