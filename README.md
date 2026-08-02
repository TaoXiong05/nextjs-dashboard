# Next.js Dashboard

A financial dashboard app built on the [Next.js App Router Course](https://nextjs.org/learn) starter, extended with authentication, a Postgres backend, and a full CI/CD pipeline.

## Features

- **Next.js App Router** — server components, streaming, and route groups (`app/dashboard/(overview)`)
- **Authentication** — [NextAuth.js](https://authjs.dev) with credentials login plus GitHub and Google OAuth (`auth.ts`, `auth.config.ts`)
- **Postgres database** — invoices, customers, revenue, and user data via `postgres`/`pg` (`app/lib/data.ts`, `app/lib/placeholder-data.ts`)
- **Server Actions** — form mutations and validation with Zod (`app/lib/actions.ts`)
- **Route protection** — middleware-based access control redirecting unauthenticated users to `/login` (`proxy.ts`)
- **Dockerized** — multi-stage build producing a minimal standalone production image (`Dockerfile`)
- **CI/CD** — GitHub Actions pipeline that lints, builds, publishes to GHCR, and deploys to Azure Web Apps (Preview and Production environments) (`.github/workflows/Ci.yml`)

## Project structure

```
app/
  api/auth/         NextAuth route handlers
  dashboard/        Protected dashboard pages (overview, customers, invoices)
  login/            Login page
  query/            Ad-hoc SQL query route (dev utility)
  seed/             Database seeding route
  lib/              Data access, server actions, definitions, utils
  ui/               Shared UI components
auth.ts             NextAuth configuration (providers, callbacks)
auth.config.ts      Route authorization logic used by the middleware
proxy.ts            NextAuth middleware entry point
Dockerfile          Multi-stage production build
.github/workflows/  CI/CD pipeline
```

## Getting started

### Prerequisites

- Node.js 20+ and [pnpm](https://pnpm.io)
- A Postgres database (e.g. [Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres))

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a `.env` file with the following variables:

   ```
   POSTGRES_URL=
   AUTH_SECRET=
   AUTH_GITHUB_ID=
   AUTH_GITHUB_SECRET=
   AUTH_GOOGLE_ID=
   AUTH_GOOGLE_SECRET=
   ```

   Generate `AUTH_SECRET` with `npx auth secret`. OAuth credentials come from the [GitHub](https://github.com/settings/developers) and [Google Cloud](https://console.cloud.google.com/apis/credentials) developer consoles.

3. (Optional) Seed the database by visiting `/seed` once the app is running.

4. Run the dev server:

   ```bash
   pnpm dev
   ```

   The app runs at [http://localhost:3000](http://localhost:3000).

### Other scripts

```bash
pnpm build   # Production build
pnpm start   # Run the production build
pnpm lint    # Lint the codebase
```

## Deployment

Pushes to `main`/`master` build a Docker image, publish it to GHCR, and deploy it to the Production Azure Web App. Other branches deploy to a Preview environment. See `.github/workflows/Ci.yml` for details.

## Learn more

This project started from the official [Next.js App Router Course](https://nextjs.org/learn). See the course curriculum for background on the dashboard's original design and data model.
