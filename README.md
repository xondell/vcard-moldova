# VCard Moldova

RU/RO digital business cards with a secure administrator panel, real Supabase accounts, persistent profiles and single-use NFC card activation.

## Administration

Open `/admin` and sign in using the administrator credentials issued privately by the operator. Credentials and card codes are never committed to Git. The administrator role is stored in Supabase `app_metadata`; registering a normal account cannot grant administrator access.

The panel shows registered users, users who signed in during the last 30 days, total cards, enabled assigned cards, links to published profiles, and published profiles. Create cards by entering a number or a URL on the site's domain. Leave the field empty to generate the next number. Duplicate numbers are rejected. Cards can be disabled, re-enabled, or deleted with confirmation. A deleted card URL shows “not found”.

Each card receives a cryptographically random code. Save it when displayed: only its SHA-256 hash is stored. An unused code can be replaced; replacing it invalidates the previous code. Codes can be activated only once by a signed-in user. Concurrent activations are serialized in a database transaction.

`/1`, `/2`, `/23` are the initial unassigned test cards. Their codes are delivered separately. They show an activation prompt until assigned to an account with a published profile. `/c/<id>` remains supported for legacy links.

## Local development

Requires Node.js >=22.13 and an existing Supabase project.

1. `npm ci`
2. Copy `.env.example` to `.env` and provide the server-only Supabase credentials.
3. Apply the SQL migration in `supabase/migrations` using an authorized database operator. On the existing VCard project this is an additive migration preserving profiles and old card identifiers. New projects must first install the base tables described in `docs/supabase.md`.
4. Run `npm run build && npm start`. The complete site and API are served on port 3001.
5. For frontend development run `npm run dev` separately on port 3000; its `/api` proxy targets port 3001.

The server fails closed when its database credentials are missing. It does not fall back to browser-only authentication. Sessions are random, revocable, HttpOnly cookies, expiring after 24 hours. Production cookies are Secure. Login, registration and activation are rate limited in the database, shared across server instances. Passwords are managed by Supabase Auth.

## Vercel

The linked Vercel project serves the Vite build and routes `/api/*` to `api/index.mjs`. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EMAIL` as server environment variables. `VITE_APP_URL` is an optional public canonical URL. Never expose the service key in browser variables. Database migrations are run explicitly, not on each function invocation.

Create the initial administrator through Supabase Auth Admin API with an operator-generated password and `app_metadata: { role: 'admin' }`. `admin` is the login alias for `ADMIN_EMAIL`. Email registration is immediately enabled; mailbox verification and password recovery are outside the current interface.

## Verification

`npm run build` checks TypeScript and creates the production build. `TEST_ADMIN_PASSWORD=... BASE_URL=http://localhost:4317 npm run test:e2e` runs browser coverage; start the server on the matching port first. The authenticated scenario creates temporary accounts/cards, verifies activation and public visibility from separate browser contexts, and exercises disabling, deletion, generated numbering, code replacement, authorization, logout and re-login. Use a staging database for routine test runs. The initial three card codes are never consumed by tests.
