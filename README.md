# VCard Moldova

Vite + React + TypeScript digital business cards, preserving the original VCard navy/yellow design. Real Supabase email/password auth, Personal/Business profiles, publication, private image uploads, QR/PNG, VCF and atomic NFC activation. RU/RO interface. No Manus hosting dependency.

## Run the complete app locally

Requires Node 22, npm 10, Docker and Supabase CLI 2.116.0+.

```bash
npm ci --ignore-scripts
supabase start
node scripts/local-env.mjs
npm run dev
```

Open **http://127.0.0.1:3000**. Local Supabase uses dedicated ports **56321** (API), **56322** (DB), **56323** (Studio), **56324** (test email inbox). Startup applies `supabase/migrations/*.sql`. No shared demo accounts or NFC secrets are seeded. Register without an NFC code to begin. Local email auto-confirm is enabled for repeatable tests; recovery email is delivered to local Mailpit.

Missing Supabase configuration disables authentication explicitly; it never enables fake login or local profile persistence. Landing examples are isolated under `/ru/demo/personal` and `/ru/demo/business`, not public profile URLs.

## Tests

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high

# Real local Supabase, two identities, no backend mocks:
node scripts/local-env.mjs
npm run test:integration

# Chromium journeys, including password recovery email and 375/390px checks:
npx playwright install --with-deps chromium
npm run test:e2e
```

Integration/E2E create randomized, disposable fixtures and clean up their own users/cards/media. They refuse remote backends unless `ALLOW_REMOTE_TESTS=yes`; never point them at production. E2E starts Vite automatically if port 3000 is free. CI runs all gates with its own local Supabase.

## Cloud configuration and deployment

1. Create/select a **dedicated VCard** Supabase project. Do not reuse an unrelated application's database.
2. Apply the migrations using the instructions in [docs/supabase.md](docs/supabase.md).
3. Set these Vercel variables for the desired Preview/Production environments:
   - `VITE_SUPABASE_URL`: project URL.
   - `VITE_SUPABASE_ANON_KEY`: public anon/publishable key, **never a service-role key**.
   - `VITE_APP_URL`: exact HTTPS deployment/custom-domain origin, without a trailing slash. If absent, sharing/QR use the current browser origin.
4. Enable email/password auth, configure confirmation, SMTP delivery, Auth Site URL and redirect allowlist for `/<ru|ro>/dashboard` and `/<ru|ro>/reset-password` on each deployment origin.
5. Import this repository into Vercel (Vite, Node 22, `npm run build`, `dist`), or run `vercel --prod` after configuring variables. `vercel.json` supplies SPA deep-link fallback and security headers. Redeploy after changing Vite environment variables.

`.env.local`, `.env.integration` and `.env.operator` are ignored and excluded from Vercel upload. Cloud app operation remains blocked until the dedicated Supabase project is configured; a frontend-only deployment is not proof of a working cloud backend.

## Provision a physical NFC card

Create an ignored `.env.operator` containing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for **the VCard project only**, then:

```bash
npm run provision:card -- VC000123
```

The operator receives a 192-bit activation secret once; only its SHA-256 verifier is stored. Print that secret securely on the packaging. Encode **`https://YOUR_DOMAIN/c/VC000123`** in the NFC tag, never the secret. Users claim cards from their dashboard. Activated cards can be disabled/re-enabled only by their owner. Activation is single-use and rate-limited to 10 authenticated attempts per 15 minutes.

## Structure

- `src/routes`: landing, auth/recovery, dashboard, public profile and NFC resolver.
- `src/features`: auth lifecycle, editor, physical-card management.
- `src/components`: existing-brand templates and publication-checked blob media rendering.
- `src/lib`: validated profile models, Supabase APIs, QR/VCF and navigation.
- `supabase/migrations`: relational entities/RLS, profile RPCs, NFC transactions, private Storage policies.
- `tests`: unit/component tests, real API integration and browser journeys.

See [HANDOFF.md](HANDOFF.md), [REMAINING_WORK.md](REMAINING_WORK.md), [design decision](docs/decisions/001-vite-supabase-mvp.md) and [official implementation sources](docs/SOURCES.md).
