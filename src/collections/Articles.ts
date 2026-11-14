import type { Block, CollectionConfig } from 'payload'
import { anyone, isAdmin } from './access'

const Heading: Block = {
  slug: 'heading',
  fields: [{ name: 'text', type: 'text', required: true }],
}
const Text: Block = {
  slug: 'text',
  fields: [{ name: 'content', type: 'richText', required: true }],
}
const Code: Block = {
  slug: 'code',
  fields: [{ name: 'code', type: 'code', required: true }],
}
const Callout: Block = {
  slug: 'callout',
  fields: [
    { name: 'label', type: 'text', defaultValue: 'Key takeaway' },
    { name: 'text', type: 'textarea', required: true },
  ],
}
const Table: Block = {
  slug: 'table',
  fields: [
    { name: 'headers', type: 'array', fields: [{ name: 'label', type: 'text' }] },
    {
      name: 'rows',
      type: 'array',
      fields: [{ name: 'cells', type: 'array', fields: [{ name: 'value', type: 'text' }] }],
    },
  ],
}
const Figure: Block = {
  slug: 'figure',
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
  ],
}
const LineDiagram: Block = {
  slug: 'lineDiagram',
  labels: { singular: 'Line diagram', plural: 'Line diagrams' },
  fields: [
    { name: 'alt', type: 'textarea', required: true, admin: { description: 'Describes the diagram for screen readers.' } },
    { name: 'startLabel', type: 'text' },
    { name: 'endLabel', type: 'text' },
    {
      name: 'markers',
      type: 'array',
      admin: { description: 'Boxes that sit on the line, e.g. servers.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'position', type: 'number', required: true, min: 0, max: 100 },
        { name: 'highlight', type: 'checkbox' },
      ],
    },
    {
      name: 'points',
      type: 'array',
      admin: { description: 'Pills above the line with a drop line, e.g. keys.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'position', type: 'number', required: true, min: 0, max: 100 },
        { name: 'highlight', type: 'checkbox' },
      ],
    },
    {
      name: 'notes',
      type: 'array',
      admin: { description: 'Small labels under the line.' },
      fields: [
        { name: 'text', type: 'text', required: true },
        { name: 'position', type: 'number', required: true, min: 0, max: 100 },
      ],
    },
    { name: 'caption', type: 'text' },
  ],
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'topic', 'level', 'status', 'publishedAt'],
    // Adds a Preview button to the editing screen. Drafts open for signed-in team members only.
    preview: (doc) => (doc?.slug ? `${process.env.NEXT_PUBLIC_SITE_URL || ''}/articles/${doc.slug}` : null),
  },
  access: {
    read: ({ req }) => (req.user?.collection === 'users' ? true : { status: { equals: 'published' } }),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  defaultSort: '-publishedAt',
  hooks: {
    beforeChange: [
      // The first time an article is published, stamp the publish date if none was set.
      ({ data }) => {
        if (data?.status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'shortTitle', type: 'text', admin: { description: 'Optional shorter name for the path panel beside an article.' } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'featured', type: 'checkbox', admin: { position: 'sidebar', description: 'Show in the Home hero.' } },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
    { name: 'author', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar' } },
    { name: 'topic', type: 'relationship', relationTo: 'topics', admin: { position: 'sidebar' } },
    {
      name: 'level',
      type: 'select',
      defaultValue: 'beginner',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'readMinutes', type: 'number', min: 1, admin: { position: 'sidebar' } },
    { name: 'dek', type: 'textarea', label: 'Summary', admin: { description: 'One or two sentences under the title and on cards.' } },
    {
      name: 'cover',
      type: 'array',
      label: 'Cover diagram',
      admin: { description: 'Boxes joined by lines, left to right. Add several items to one box to stack them.' },
      fields: [
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            {
              name: 'style',
              type: 'select',
              defaultValue: 'plain',
              options: [
                { label: 'Plain', value: 'plain' },
                { label: 'Dark', value: 'dark' },
                { label: 'Accent', value: 'accent' },
              ],
            },
          ],
        },
      ],
    },
    { name: 'body', type: 'blocks', blocks: [Heading, Text, Code, Callout, Table, Figure, LineDiagram] },
    {
      name: 'quiz',
      type: 'array',
      label: 'Check your understanding',
      fields: [
        { name: 'question', type: 'text', required: true },
        {
          name: 'options',
          type: 'array',
          fields: [
            { name: 'text', type: 'text', required: true },
            { name: 'correct', type: 'checkbox' },
          ],
        },
        { name: 'explanation', type: 'textarea' },
      ],
    },
  ],
}
