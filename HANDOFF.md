# VCard Moldova handoff — 2026-10-16

## Outcome

The existing Vite prototype now has real Supabase-backed auth, profile persistence/publication, public profiles, private image uploads, QR/VCF, and server-side NFC activation. Original VCard branding, landing, Personal/Business layout and CSS are retained. No Next.js migration or Manus service dependency.

- Branch: `feat/complete-vcard-mvp` (based on upstream `f92c4a1`).
- Frontend deployment: **https://vcard-moldova.vercel.app**.
- **Important:** this deployment currently has no dedicated cloud Supabase configuration. Authentication is explicitly disabled there. The full working journey was verified against real, isolated **local** Supabase, not the cloud deployment. Do not present the deployed frontend as a working hosted SaaS yet.
- Pull request and final source SHA: recorded in the final delivery / GitHub branch history.

## Milestones and verification

| Milestone | Source result | Evidence |
|---|---|---|
| M0 | Stabilized/extracted route components, router, locale helpers, lint/types/tests, SPA deployment config | Build/typecheck/lint; routing tests |
| M1 | Supabase email/password signup/login/logout, SDK sessions, recovery, dashboard guard, relational tables/RLS | Real signup/wrong-password/session/logout/isolation API checks; real recovery email/browser flow |
| M2 | Transactional saves, stable editable slug, publish/unpublish, safe public reads, not-found states, previews | Two independent browser contexts see updates; API draft/public/cross-user checks |
| M3 | 192-bit provisioning secrets stored only as verifiers, atomic activation, per-account attempt limit, permanent resolver, owner status controls | Actual invalid/reused/foreign-target/concurrent claims, disabled/draft destinations and slug edit resolution |
| M4 | Complete fields/socials/actions/hours/maps, logo/avatar/cover upload, publication-checked media, safe URLs and VCF, localized core UI/mobile navigation | Unit/component validation; actual image upload/public display; 375px/390px overflow checks |
| M5 | CI, repeatable backend/browser/deployment tests, security/dependency checks and Vercel frontend deploy | Cloud backend configuration remains externally blocked; do not claim production acceptance |

Executed evidence so far:
- TypeScript, ESLint and production build pass.
- 20 unit/component tests pass, including pending-save and dirty-language-switch regression cases.
- 44 real Auth/PostgreSQL/Storage integration checks pass, including forbidden public media signing and post-unpublish downloads.
- 5 browser tests pass: responsive/routes, full Personal and Business journeys, Romanian real-email recovery, and expired recovery with a different active account.
- Dependency audit: zero vulnerabilities; 278 package registry signatures verified, 110 attestations verified.
- All five migrations were reapplied to an empty **local-only** database after confirming it contained zero Auth users; integration and browser suites passed again.
- Deployed direct loads: `/ru`, `/ro`, `/ru/login`, `/ro/dashboard/profile`, `/p/unknown`, `/c/VC000123` all serve SPA HTML with security headers.
- Deployed RU/RO example profiles, 375px/390px landing and unauthenticated dashboard redirect pass; explicit missing-Supabase blocker confirmed.

Independent review identified public media capability/revocation, expired-recovery account ambiguity, two editor state-loss bugs, server/client schema mismatches, a loose test-host guard and public media account-ID disclosure. All seven were addressed in the single review fix pass. Regression tests caught the editor/recovery/schema defects; real backend checks verify hardened media behavior. Test-development failures also resolved: corrupted PNG fixture and a text locator including a nested phone label.

Visual review additionally caught the original mobile sidebar hiding navigation; the final browser journeys assert mobile dashboard navigation is visible, and snapshots verify its layout. Production build succeeds with a documented 662 kB entry-chunk advisory; splitting is deferred, not represented as a failed build or a performance benchmark.

## Reproduce the full demo

```bash
npm ci --ignore-scripts
supabase start
node scripts/local-env.mjs
npx playwright install --with-deps chromium
npm run lint
npm run typecheck
npm test
npm run build
npm run test:integration
npm run test:e2e
npm audit --audit-level=high
node tests/deployment.mjs https://vcard-moldova.vercel.app
```

For manual use, run `npm run dev`, register at http://127.0.0.1:3000/ru/register (or `/ro/register`) without an activation code, edit/save/publish, and open `/p/SLUG` in a separate browser. Provision inventory with `npm run provision:card -- VC000123` using an ignored `.env.operator` for this backend; claim it in dashboard → My cards, then open `/c/VC000123`. Use the service-role key only in the operator/test environment, never Vite.

## Required cloud configuration

Connected Supabase account contains organizations **LitLab** and **Boris LLC**, but no VCard project. Existing projects belong to other applications and were not altered/reactivated. The owner must select the owning organization and authorize/create a dedicated VCard project (including any plan/billing implications), then supply its project reference and public URL/key. Follow `docs/supabase.md` to apply migrations and configure email/redirect URLs. Set the three `VITE_*` variables from `.env.example` in the dedicated Vercel project and redeploy.

No frontend service-role key is required. No external account password or secret is committed. Local `.env.*` files are ignored and excluded from Vercel uploads.

## Decisions and limitations

See `docs/decisions/001-vite-supabase-mvp.md` for authorization/Storage tradeoffs and `REMAINING_WORK.md` for exact blockers and production-hardening items. No payments, subscriptions, shipping fulfillment, physical tag writer or page builder are introduced.
