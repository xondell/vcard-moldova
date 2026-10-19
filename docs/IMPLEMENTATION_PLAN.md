# VCard MVP Implementation Plan

**Goal:** complete M0–M5 on feat/complete-vcard-mvp, preserving the prototype.
**Architecture:** existing Vite SPA + React Router + Supabase Auth/PostgreSQL/Storage. Database functions own transactional writes and activation.
**Spec:** docs/MVP_SPEC.md and supplied VCard_Audit_Milestones.md.
**Execution:** inline, continuously, per user's explicit instruction; no approval pauses.

## Global constraints
- No Next.js, redesign, fake persistence, service-role browser keys or unrelated service changes.
- Build and commit each milestone. Missing external access does not stop independent work.

## Review focus
- Expired confirmation/recovery sessions: actionable localized errors, no dashboard leakage.
- Draft media and profiles must not leak via public APIs.
- Concurrent/reused NFC activation must have exactly one winner.
- Unsafe URL schemes and CRLF must not become executable links/VCF properties.
- Failed saves/uploads must preserve editable state without reporting success.

## Tasks / progress ledger
- [x] M0: pinned dependencies; added lint/typecheck/test tooling and route tests; extracted landing/shared/public/dashboard/auth modules; routing/locales/404 and Vercel rewrites. npm test (3), lint, typecheck, build passed. Temporary prototype auth/data remain only until M1/M2; not represented as secure.
- [x] M1 foundation: real login/signup/recovery/session provider and guard; relational tables with RLS and profile creation trigger. Unit tests (7), lint, typecheck, build passed. Local DB integration pending stack download; dashboard persistence/logout replaced in M2 before release.
- [x] M2: transactional profile RPC/data adapters and asynchronous dashboard/public routes; stable slug, publish/unpublish, previews, real account/logout and QR URLs. Removed all prototype localStorage auth/profile code. Unknown/draft public URLs have no demo fallback. Unit tests (10), lint, typecheck and production build passed. Actual database integration queued for M5/local stack.
- [x] M3 implementation: secure operator-only provisioning, 192-bit secrets/hashed verifiers, transactional locking and persistent per-account limiter, resolver, actual owner card list and disable/re-enable controls. Unit/schema tests (12), lint, typecheck and build passed. Actual invalid/reuse/concurrency DB tests remain in M5 (static SQL tests are not proof of concurrency).
- [x] M4: full personal/business fields, social/action/hours/map editor; private Storage with ownership/publication policies; raster validation/re-encoding, avatar/logo/cover uploads; safe links, escaped VCF, actual initials, localized core controls and responsive additions. Unit/component tests (18), lint, typecheck, build passed. Local Supabase started successfully after choosing isolated ports 56320–56329; all four migrations applied cleanly. Mobile/browser checks follow in M5.
- [x] M5 feasible development/QA: frozen clean npm install, lint/typecheck/build, 20 unit/component tests, 44 real backend checks and 5 browser tests passed. All five migrations applied from an empty local schema. Both profile types, avatar/logo/cover uploads, draft previews, QR/VCF, two-browser persistence, NFC, recovery/expired recovery, mobile navigation/375/390px verified. Independent review fixes applied and regression-tested. Dependency audit zero vulnerabilities; registry signatures verified. Dedicated Vercel frontend deployed and deep-link/security/mobile smoke-tested. HANDOFF.md/REMAINING_WORK.md/README and CI supplied.
- [ ] External acceptance gate: configure dedicated cloud Supabase + email/redirects, redeploy frontend with public variables, rerun hosted integration/E2E. No VCard project exists in connected Supabase organizations; unrelated projects were intentionally not modified. Frontend deployment fails closed without that configuration.

## Interfaces
- lib/product.ts retains Profile union and presentation/QR/VCF helpers, extended with optional image URLs.
- lib/navigation.ts supplies locale-aware navigation; features/auth exposes useAuth().
- lib/profiles.ts exposes getOwnedProfile(), saveOwnedProfile(profile,published), getPublicProfile(slug).
- lib/cards.ts exposes listCards(), activateCard(code,profileId), resolveCard(publicId).
- SQL RPCs expose safe typed profile JSON, never activation verifiers or private user metadata publicly.

## Decisions / evidence
- Initial source comparison: upstream matches archive; no prior milestone work present.
- Working tree was an archive without .git; restored identical upstream git metadata, preserving all local files.
- GitHub and Vercel CLI authenticated. Supabase authenticated, but no VCard project in account; Docker available for isolated local verification.
- Review pass: fixed public image-signing capability via operation-scoped RLS downloads and opaque object names; fixed expired-recovery session ambiguity; locked editing during saves/uploads; preserved dirty data across language changes; aligned SQL URL ports/action icon validation; restricted test hosts to exact loopback names.
- Additional visual QA caught the prototype hiding mobile dashboard navigation; restored a horizontal mobile nav and verified its buttons in both browser journeys. Saved feedback is inline and auto-dismisses rather than covering editor fields.
- Final local command: npm install --package-lock-only --ignore-scripts && npm ci --ignore-scripts && npm run lint && npm run typecheck && npm test && npm run build && npm run test:integration && npm run test:e2e && npm audit --audit-level=high → exit 0. Build emits a documented advisory for the 662 kB real-backend entry chunk.
- Ruling: do not choose a cloud organization/paid plan or repurpose unrelated inactive projects without owner configuration. Cost: hosted backend remains blocked; full real local backend and repeatable setup are supplied.
- Ruling: single-profile-per-account and official Supabase SPA SDK sessions are the MVP boundary, not a BFF/multi-profile redesign. Cost: account-type migration/multiple cards-as-profiles need follow-up work; physical NFC cards themselves can be multiple.
- Deferred minor: route-level bundle splitting; documented build advisory, functional journey is unaffected.
