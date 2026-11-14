import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from './access'

export const Topics: CollectionConfig = {
  slug: 'topics',
  admin: { useAsTitle: 'name', group: 'Content', defaultColumns: ['name', 'slug', 'order'] },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'description', type: 'text', admin: { description: 'Short line shown on the topic card.' } },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'inFilter', type: 'checkbox', label: 'Show as a filter pill on Home', defaultValue: false },
    { name: 'inGrid', type: 'checkbox', label: 'Show in "Browse by topic"', defaultValue: true },
    { name: 'popular', type: 'checkbox', label: 'Show as a "Popular" chip in the Home hero', defaultValue: false },
  ],
}
