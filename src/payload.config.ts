import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Learners } from './collections/Learners'
import { Media } from './collections/Media'
import { Topics } from './collections/Topics'
import { Paths } from './collections/Paths'
import { Articles } from './collections/Articles'
import { Progress } from './collections/Progress'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Hosted Postgres when DATABASE_URL points at one (production); a local SQLite file otherwise.
const databaseUrl = process.env.DATABASE_URL || 'file:./sd-blog.db'
const usePostgres = /^postgres(ql)?:\/\//.test(databaseUrl)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Articles, Paths, Topics, Media, Users, Learners, Progress],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: usePostgres
    ? postgresAdapter({
        pool: { connectionString: databaseUrl },
        migrationDir: path.resolve(dirname, 'migrations'),
      })
    : sqliteAdapter({ client: { url: databaseUrl } }),
  sharp,
  plugins: [
    // Uploaded images go to Vercel Blob when its token is present; to the local media/ folder otherwise.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
