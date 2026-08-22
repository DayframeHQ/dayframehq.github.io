# Dayframe

Dayframe is a mobile-first personal operating system for daily health, training, nutrition, movement, recovery and longer-term life progress. It is a static React application backed by Supabase Auth and Postgres, designed for secure deployment to the DayframeHQ GitHub Pages organization site.

The app includes an interactive browser-only demo. A real account starts completely clean—demo content and owner health data are never copied into authenticated accounts.

## What is implemented

- Supabase Google OAuth, verified email/password and email magic-link authentication with session restoration
- First-login onboarding for profile, units, timezone, targets and training schedule
- Five-tab responsive app shell: Today, Train, Food, Life and Insights
- Calendar/date navigation and historical daily editing foundation
- Universal Quick Add for workouts, food, hydration, activity, recovery, measurements, pain, reminders, notes, goals and travel
- Set-by-set workout logging, previous performance, RIR, rest timer and double-progression recommendation
- Explicitly copyable `4-Day Recomp — Upper/Lower` program template; never assigned automatically
- Daily nutrition totals, source confidence labels and a live recipe-per-serving calculator
- Goals, wishes, travel plans, projects and dated notes
- Body, activity, nutrition, training, recovery and weekly-review insights
- Manual bloodwork entry and repeated-biomarker charts with non-diagnostic language
- JSON account export, meal CSV export, JSON import validation and confirmed account deletion flow
- Light/dark themes, accessible focus states, responsive desktop rail and mobile bottom navigation
- PWA service worker plus IndexedDB queue for intermittent connectivity
- Supabase SQL migration with explicit owner policies for `SELECT`, `INSERT`, `UPDATE` and `DELETE`
- Vitest unit tests, Playwright mobile/desktop smoke tests and GitHub Pages deployment workflow

## Architecture

| Layer | Technology | Purpose |
| --- | --- | --- |
| UI | React 19, TypeScript, Tailwind CSS | Strict, responsive component UI |
| Routing | HashRouter | Avoids GitHub Pages rewrite failures |
| Remote state | TanStack Query + Supabase client | Authenticated API/cache foundation |
| Forms | React Hook Form + Zod | Typed validation |
| Database | Supabase Postgres | User-owned relational data |
| Authorization | Supabase Row Level Security | Database-level account isolation |
| Offline | Dexie / IndexedDB + PWA | Queued writes and cached application shell |
| Charts | Recharts | Lightweight trends and weekly review |
| Quality | ESLint, Vitest, Playwright | Static, unit and smoke-test coverage |

The browser receives only the Supabase public anon/publishable key. Authorization does not depend on the UI: each personal table validates `auth.uid() = user_id` in Postgres.

## Local setup

Requirements: Node.js 22 or later, npm, and an existing Supabase project.

```bash
git clone https://github.com/DayframeHQ/dayframehq.github.io.git
cd dayframehq.github.io
npm install
cp .env.example .env.local
npm run dev
```

Without environment values, the sign-in page remains safe and offers an interactive local demo. Demo changes are stored only in that browser.

### Environment variables

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

Find both values in Supabase Dashboard → Project Settings → API. These values are intended for browser use. Never add the service-role key, OAuth client secret or another private credential to a `VITE_` variable.

## Supabase database setup

You said the Supabase project already exists, so connect this repo and apply the included migration.

### Option A: Supabase CLI (recommended)

```bash
npx supabase login
npx supabase link --project-ref ubbxllmbzsmebqlpapcs
npx supabase db push
```

Creating the Supabase project is not enough: `db push` must complete before authenticated Dayframe data can persist. If the app shows **Connect the database**, the project exists but these tables have not been applied yet.

The migration at [`supabase/migrations/202608220001_initial_schema.sql`](supabase/migrations/202608220001_initial_schema.sql) creates the normalized schema, indexes, auth-profile trigger, reusable training template, public exercise reference library and RLS policies.

### Option B: SQL editor

Open Supabase Dashboard → SQL Editor → New query, paste the migration file, and run it once. Do not rerun a successful initial migration by hand; use a new timestamped migration for later schema changes.

### Verify RLS

Every personal table is created with RLS enabled and four explicit policies:

- `SELECT`: authenticated user may read only rows whose `user_id` equals `auth.uid()`
- `INSERT`: new rows must use the signed-in user's ID
- `UPDATE`: both the existing and updated row must remain owned by that user
- `DELETE`: only the owner can delete the row

System exercise rows and public program templates have read-only authenticated access. Users can mutate only their own custom exercises and copied programs.

For local database tests:

```bash
npx supabase start
npx supabase test db
```

The pgTAP checks in [`supabase/tests/rls.sql`](supabase/tests/rls.sql) verify that one authenticated user cannot select, insert or modify another user's records.

## Authentication setup

### Email and password

1. Open Supabase Dashboard → Authentication → Providers → Email.
2. Enable the Email provider.
3. Turn on **Confirm email** so new users must verify ownership before password login. Dayframe shows a verification message after signup and Supabase sends the confirmation email.
4. Open Authentication → URL Configuration.
5. Set Site URL to `https://dayframehq.github.io` for production.
6. Add redirect URLs:
   - `http://localhost:5173/**`
   - `https://dayframehq.github.io/**`

The same Email provider powers password login and magic links. Magic links are restricted to existing accounts; creating a new account requires setting a password.

Dayframe uses the verified email address as the account identifier; it does not use a separate public username. The password is handled by Supabase Auth and is never stored in Dayframe tables.

For production, configure a custom SMTP provider under Authentication → Email if reliable delivery and a branded sender are important. Supabase's default SMTP is suitable only for initial testing and is rate-limited.

### Google OAuth

1. In Google Cloud Console, create or select a project.
2. Configure the OAuth consent screen.
3. Create an OAuth 2.0 Client ID of type **Web application**.
4. Add this exact Google authorized redirect URI:

   ```text
      https://ubbxllmbzsmebqlpapcs.supabase.co/auth/v1/callback
   ```

5. In Supabase Dashboard → Authentication → Providers → Google, enable Google and paste the Google Client ID and Client Secret.
6. Keep the application redirect URLs listed in the previous section.

The Google client secret stays inside Supabase. It must never be committed to this repository or added to GitHub Pages build variables.

### Account deletion Edge Function

Deleting an Auth user requires server-side admin privileges, so the browser calls the included authenticated Edge Function:

```bash
npx supabase functions deploy delete-account
```

Supabase automatically exposes its project URL, anon key and service-role key to deployed functions. The function validates the caller's bearer token before deleting that exact user. Cascading foreign keys then remove the user's owned rows.

## Private owner import

Do not add personal measurements, bloodwork, meals, goals, trips or notes to source files or SQL seeds. Place any local owner import file inside `.private/`, which is gitignored, then import it after signing in.

Supported top-level JSON envelope:

```json
{
  "version": 1,
  "profile": {
    "display_name": "Private owner",
    "timezone": "Asia/Kolkata",
    "preferred_units": "metric"
  },
  "body_measurements": [],
  "lab_results": [],
  "meal_entries": [],
  "activity_logs": [],
  "pain_logs": [],
  "goals": [],
  "travel_plans": [],
  "notes": []
}
```

The UI validates the envelope, shows record counts for review, forces every imported row to the signed-in user ID, and writes only the allow-listed personal tables after confirmation. For very large historical datasets, a future protected transactional RPC would additionally prevent a half-completed import if the connection fails midway.

## Development commands

```bash
npm run dev          # local Vite server
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run test:e2e     # Playwright mobile + desktop smoke tests
npm run build        # strict TypeScript and production build
npm run preview      # serve the built site locally
```

Install Playwright's browser once before the first end-to-end run:

```bash
npx playwright install chromium
```

## GitHub Pages deployment

The workflow at [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) runs lint, unit tests and a production build before deploying on every successful push to `main`.

1. In the GitHub repository, open Settings → Secrets and variables → Actions.
2. Add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Open Settings → Pages.
4. Under Build and deployment, select **GitHub Actions** as the source.
5. Push to `main` and watch Actions → Test and deploy Dayframe.

Because this is the organization-root repository, Vite uses `/` as its base and the deployment URL is:

```text
https://dayframehq.github.io
```

## Privacy model

- The public repository contains no private health or owner seed data.
- A newly authenticated user receives empty private tables.
- The shared workout template must be copied explicitly.
- Browser code never receives the service-role key or third-party API secrets.
- Nutrition estimates remain labelled as estimates.
- Health and pain observations avoid diagnosis or causal claims.
- Dayframe does not claim HIPAA or medical regulatory compliance.

## Current limitations

- The primary winged-athlete mark and alternate gada/progress mark are stored as two-colour SVGs in `public/brand/`.
- Browser notifications cannot guarantee background delivery. Reliable push requires a server-side scheduler plus Web Push/FCM.
- Wearable, Apple Health, barcode, restaurant and nutrition-provider integrations are adapter placeholders, not V1 claims.
- Offline writes use a simple ordered queue. Concurrent edits across several offline devices are not merged with CRDT semantics.
- Progress-photo upload is deferred.
- Large JSON imports are not yet a single database transaction; export first before importing into a non-empty account.
- Insights become meaningful only after enough authenticated history exists; Dayframe does not invent conclusions for clean accounts.

## Recommended roadmap

1. Add transactional private JSON import plus per-table CSV exports.
2. Expand integration tests against a local Supabase stack, including offline queue replay and completed workout history.
3. Add server-scheduled Web Push reminders and optional wearable import adapters.

## Brand assets

- `public/brand/dayframe-athlete.svg` — primary logo and app icon
- `public/brand/dayframe-gada.svg` — approved alternate logo

Both assets use only Obsidian `#181513` and Porcelain `#F5F0E7`.
