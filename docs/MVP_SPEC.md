# VCard MVP design and audit comparison

The supplied 2026-10-15 audit matches upstream f92c4a1. Local differences are generated compiler artifacts only. Keep the existing Vite/React templates, CSS, navy #0F2147 and yellow #FCCC08. No Next.js or Manus services.

Use Supabase Auth for email/password, confirmation, recovery and persisted SDK sessions. Dashboard guards improve UX; PostgreSQL RLS is the authorization boundary. One account owns one profile in this MVP. A profile has a stable unique slug and separate personal/business detail records. Only explicitly published contact data is public; account IDs and activation verifiers are not public API data.

Use narrow database functions for transactional profile writes, public reads and NFC activation. NFC public IDs are permanent, independently generated secrets are stored as SHA-256 verifiers, claims lock records atomically and authenticated attempts are rate-limited. Provisioning is an operator-only script. Card ownership cannot be changed through table APIs.

Keep landing examples explicitly isolated at /:locale/demo (not /p/example). Split route components without redesign. Use React Router, real asynchronous loading/error/not-found states, RU/RO paths and query language for permanent public paths. Dashboard saves profile data to the database, uploads raster images to owner-scoped Supabase Storage with opaque filenames, and generates QR from actual app/card URLs. Public media downloads recheck publication through operation-scoped RLS; public callers cannot create signed URLs. Unsafe links are rejected in browser and SQL; vCard fields are escaped.

Trust boundaries: browser data and uploaded bytes are untrusted; auth.uid() and RLS control ownership; service credentials exist only in operator environments. Never expose activation hashes through public reads. Public image reads require a published owning profile. Public cards resolve only to published profiles. Failed operations must never show saved/activated success.

Deploy the static SPA to a dedicated Vercel project with deep-link fallback and security headers. Do not modify unrelated Supabase projects. If a dedicated cloud Supabase project cannot be identified/configured safely, verify against local Supabase and document cloud configuration as blocked.

Acceptance: real register/login/recovery, cross-device CRUD and publishing, both templates, images, QR/VCF, atomic single-use NFC, two-user isolation, translated controls, mobile checks, build/typecheck/lint/unit/integration/E2E evidence. Distinguish local verification from cloud verification.
