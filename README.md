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

## Google sign-in

Optional, and alongside email and password. It turns on when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.

- **Learners** get a "Continue with Google" button on the sign-in and create-account pages. The first use creates
  their account. A learner who already has an account with the same email address lands in that account.
- **Admins** get a "Sign in with Google" button on the `/admin` login screen, but only when `GOOGLE_ADMIN_EMAILS`
  lists at least one address. Only listed addresses are let in; a listed address with no admin account yet gets one
  on first sign-in.
- **Redirect address** registered in Google Cloud must be `<site address>/auth/google/callback`. Set
  `NEXT_PUBLIC_SITE_URL` so the site always sends that exact address.
- Only the name and email address are requested from Google.

## Not built yet

- Password reset ("Forgot password?" is a placeholder link). It needs an email service configured in Payload.
- "Subscribe" in the header opens account creation; there is no newsletter.
- Quiz answers are not stored.
- About is a placeholder link. Privacy and Terms are template pages with bracketed parts to fill in.

## Deploying to Vercel

The repo is set up for Git → Vercel. Each push to `main` runs `npm run build:vercel`, which applies database
migrations, seeds the sample content if the database is empty, and builds the site.

Vercel needs these environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Postgres connection string (set automatically when a Postgres database is added from Vercel's marketplace) |
| `BLOB_READ_WRITE_TOKEN` | Set automatically when a Vercel Blob store is connected; used for uploaded images |
| `PAYLOAD_SECRET` | A long random string |
| `NEXT_PUBLIC_SITE_NAME` | Name shown in the header and footer |
| `NEXT_PUBLIC_SITE_URL` | Public address of the site |

- **Database.** With a `postgres://` address in `DATABASE_URL` the project uses Postgres; otherwise it uses a local
  SQLite file. After changing anything in `src/collections/`, create a migration with
  `DATABASE_URL=postgres://… npm run payload migrate:create` and commit the new files in `src/migrations/`.
- **First admin.** Demo accounts are not created on Postgres. Open `/admin` on the live site and create the first
  admin account straight away; until one exists, anyone who opens that page can create it.
- **Uploads.** Images go to Vercel Blob when its token is present, and to the local `media/` folder otherwise.
- **Sessions.** Learners and admins use the same sign-in cookie, so signing in as one in a browser signs out the other.
