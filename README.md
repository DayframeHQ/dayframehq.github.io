# Dayframe V2

Dayframe is a mobile-first personal operating system centered on three questions: what am I training today, what am I studying today, and am I progressing? It preserves private health, nutrition, Life, offline, and PWA capabilities without letting them overwhelm the daily view.

The production app uses Supabase Auth and Postgres. Its interactive demo is fictional, stays in that browser, and is never copied into an authenticated account.

New accounts complete one low-friction step: name and the areas they want to use. Dayframe stores those choices in authenticated user metadata, ranks Today and Quick Add around them, and asks domain-specific questions only on the first visit to Train or Study. Every setup can be skipped and interests remain editable in Settings; no extra migration is required.

## Product structure

Primary navigation:

- Today — persisted Train and Study sessions, compact health context, relevant reminders
- Train — Today, Program, History, Templates; set logging, RIR, prior performance and transparent double progression
- Study — Today, Roadmap, Notebook, Resources; sessions, attempts, structured notes and explicit reviews
- Life — Focus, Travel, Notes, Someday
- Progress — Overview, Train, Study, Body/Health with real 7D–1Y range queries

Secondary routes are `/nutrition`, `/health`, and `/settings`. Legacy `/food` and `/insights` links redirect to `/nutrition` and `/progress`.

## V2 capabilities

- Shared normalized planning engine with immutable public template versions and explicit transactional copies
- Complete 1–7-day workout catalog, including the exact 4-Day Recomp golden program
- Complete 40-week Computer Science for Software Engineers roadmap (light, standard, intensive pacing metadata)
- Complete 8-week Senior Software / Backend Interview sprint across DSA, LLD, HLD, mocks and behavioral work
- Specialized workout-set and Study-attempt execution schemas; planning is shared, results are not forced into a generic table
- Manual attempt outcomes, independent solve rate, structured notes, review dates and honest no-data states
- Authoritative daily nutrition summaries or itemized meals with a single non-double-counting calculation rule
- Categorized, context-aware Quick Add whose success states correspond to a persisted write or durable offline queue
- Private JSON V2 export/import, recipes, goals, travel, notes, bloodwork and existing V1 history preserved
- Screenshot/document import review UI plus an authenticated server adapter that honestly returns unavailable until a provider is configured
- Supabase RLS, pgTAP isolation coverage, Vitest rules, and Playwright mobile/desktop critical flows

Dayframe does not scrape LeetCode, diagnose health conditions, fabricate trends, or imply endorsement by referenced educational/training sources.

## Local setup

Requirements: Node.js 22+, npm, and a Supabase project.

```bash
git clone https://github.com/DayframeHQ/dayframehq.github.io.git
cd dayframehq.github.io
npm install
cp .env.example .env.local
npm run dev
```

Use only browser-safe project values:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
```

Find them in Supabase Dashboard → Project Settings → API. Never put a secret/service-role key, Google client secret, or import-provider credential in a `VITE_` variable.

## Apply the database migrations

The V1 migration has already been applied and must not be edited or rerun. Apply the additive migrations in order:

1. `supabase/migrations/202608220002_v2_plan_study_schema.sql`
2. `supabase/migrations/202608220003_v2_curated_templates.sql`
3. `supabase/migrations/202608230001_secure_account_deletion.sql`

CLI:

```bash
npx supabase login
npx supabase link --project-ref ubbxllmbzsmebqlpapcs
npx supabase db push
```

If the CLI account lacks project privileges, use Supabase Dashboard → SQL Editor → New query, paste and run each file separately in timestamp order. A successful run may say “Success. No rows returned.” Do not rerun an already successful migration.

V2 is non-destructive: it retains every V1 table and row, adds compatibility links from workout programs/sessions, and creates owner-only plan, Study, nutrition-summary and import-job tables. Public templates are authenticated read-only. `copy_template_version` verifies `auth.uid()`, accepts only a published version, and copies a complete plan in one transaction.

Local RLS tests:

```bash
npx supabase start
npx supabase test db
```

## Authentication

Email/password, verified email, magic links, Google OAuth, and session restoration remain supported.

- Supabase Dashboard → Authentication → Providers → Email: enable Email and Confirm email.
- Authentication → URL Configuration: Site URL `https://dayframehq.github.io`; redirects `http://localhost:5173/**` and `https://dayframehq.github.io/**`.
- Google Cloud OAuth client type: Web application.
- Google authorized redirect URI: `https://ubbxllmbzsmebqlpapcs.supabase.co/auth/v1/callback`.
- Paste the Google Client ID and Client Secret into Supabase Authentication → Providers → Google. The secret stays in Supabase.

Authenticated account deletion uses the `delete_current_user()` database RPC from migration `202608230001`. It derives the target exclusively from `auth.uid()`, so callers cannot supply another user ID. Deleting that auth user activates the existing foreign-key cascades for user-owned data and requires no browser secret or separately deployed Edge Function.

## Optional import adapter

`supabase/functions/extract-import/index.ts` authenticates the caller, validates kind/MIME/size and import-job ownership, and keeps provider secrets server-side. Deploy it only when needed:

```bash
npx supabase functions deploy extract-import
```

No extraction provider or credential is committed. Without `DAYFRAME_IMPORT_PROVIDER` and a deliberately implemented provider adapter, the function returns `provider_unavailable`; the app continues to offer manual nutrition summary entry and does not upload/retain selected screenshots. Provider output must pass the normalized Zod schema and user review before plan activation.

## Development and QA

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright covers both a Pixel-sized mobile viewport and desktop Chrome. The PWA service worker and IndexedDB write queue remain enabled.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` deploys only after lint, unit tests, and build pass on `main`.

Repository Settings → Secrets and variables → Actions needs:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (the browser-safe publishable key)

Settings → Pages must use GitHub Actions. Production is `https://dayframehq.github.io`.

## Privacy and current limitations

- All personal V2 rows enforce `auth.uid() = user_id` for select, insert, update, and delete.
- Public templates contain no owner measurements, meals, biomarkers, goals, or private notes.
- Template sources are references only; Dayframe is not affiliated with or endorsed by them.
- Browser notifications do not guarantee scheduled background delivery.
- External screenshot/document extraction is unavailable until a server provider is intentionally configured.
- Large generic imports are ordered but are not yet wrapped in one account-wide database transaction; export first before importing into a populated account.
- Health language remains non-diagnostic and Dayframe makes no medical-regulatory compliance claim.

## Brand

- `public/brand/dayframe-athlete.svg` — primary winged-athlete mark
- `public/brand/dayframe-gada.svg` — approved alternate mark

Both use only Obsidian `#181513` and Porcelain `#F5F0E7`.
