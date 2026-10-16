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
- [ ] M2: test draft visibility, cross-user writes and persisted edits; add profile CRUD RPC/data adapters and asynchronous dashboard/public routes; stable slug, publish, previews and QR URLs. Verify tests/build; commit.
- [ ] M3: test valid/invalid/reused/racing activation and card states; add secure provisioning, atomic rate-limited RPC, resolver and actual card list. Verify tests/build; commit.
- [ ] M4: test link/VCF/upload validation; complete editor fields, owner-scoped image uploads, real avatars/cover, action/social/hours editing, RU/RO and mobile polish. Verify tests/build; commit.
- [ ] M5: run lint/typecheck/build/unit, local Supabase integration and browser journeys for both profile types, 375/390px and direct URLs; security/dependency review; dedicated Vercel deployment if available; update HANDOFF.md/REMAINING_WORK.md/README; final review; commit, push, PR.

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
