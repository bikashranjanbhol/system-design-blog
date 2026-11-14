# System design blog (Next.js + Payload)

A blog for learners of system design: articles, learning paths, learner sign-in and reading progress.
The site and the editing panel are one Next.js project.

## Run it locally

Needs Node 22 or newer.

```bash
cp .env.example .env      # then set PAYLOAD_SECRET to a long random string
npm install
npm run seed              # sample content from the mockups (only fills an empty database)
npm run dev
```

- Site: http://localhost:3000
- Editing panel: http://localhost:3000/admin

The seed creates two accounts. Change both passwords before the site goes anywhere public.

| Who | Where they sign in | Email | Password |
|---|---|---|---|
| Admin (writes articles) | /admin | admin@example.com | change-me-admin |
| Demo learner | /sign-in | learner@example.com | change-me-learner |

## What is where

| Path | Purpose |
|---|---|
| `src/collections/` | Content model: Articles, Paths, Topics, Media, Users (your team), Learners, Progress |
| `src/app/(frontend)/` | Pages: Home, `articles/[slug]`, `learning-paths`, `sign-in`, `create-account`, `feed.xml` |
| `src/app/(frontend)/styles.css` | All styling; colours and fonts are the variables at the top |
| `src/app/(frontend)/actions.ts` | Sign-in, account creation, read tracking, save |
| `src/components/` | Header, footer, cover diagram, article body blocks, quiz |
| `src/seed.ts` | Sample content |

## How it behaves

- **Reading is open.** Only progress tracking and Save need a learner account.
- **Read status.** An article is marked as read when a signed-in learner scrolls to the end of it.
- **Article body** is built from blocks in the editing panel: heading, text, code, callout, table, image figure, line diagram.
  Headings become the "On this page" list.
- **Covers** are small box-and-line diagrams typed in as labels, not uploaded images.
- **Drafts.** Only articles with status "Published" appear on the site.
- **Site name** comes from `NEXT_PUBLIC_SITE_NAME`.

## Not built yet

- Password reset ("Forgot password?" is a placeholder link). It needs an email service configured in Payload.
- "Subscribe" in the header opens account creation; there is no newsletter.
- Quiz answers are not stored.
- About, Privacy and Terms are placeholder links.

## Before going live

- **Database.** Local development uses a SQLite file, and Payload creates the tables automatically in development.
  In production, tables are created by migrations: `npm run payload migrate:create`, then `npm run payload migrate`
  as part of deployment. On a serverless host (for example Vercel) use a hosted database such as Postgres with
  `@payloadcms/db-postgres` in `src/payload.config.ts`.
- **Uploads.** Images uploaded in the editing panel are written to the local `media/` folder. On a host without a
  persistent disk, add a storage adapter.
- **Sessions.** Learners and admins use the same sign-in cookie, so signing in as one in a browser signs out the other.
