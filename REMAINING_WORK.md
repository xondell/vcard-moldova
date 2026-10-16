# Remaining work / external blockers

## Blocking a functional cloud demo

1. **Dedicated cloud Supabase project is missing.** Account access exists, but none of the account's projects is VCard. Do not repurpose another app's project. Owner must choose LitLab vs Boris LLC and approve any hosting plan/billing, or supply an existing dedicated VCard project. No unrelated services were changed.
2. Apply the committed SQL migrations to that project; set its URL/public anon key and actual frontend origin in Vercel, then redeploy.
3. Configure email/password Auth, production email confirmation/SMTP, Site URL and both locale dashboard/recovery redirect paths. Verify email delivery on the chosen sender/domain.
4. Repeat the same isolation/publication/NFC tests against a dedicated cloud **test** project and the deployed frontend. Local passing tests are not cloud evidence. Provision production inventory separately and keep secrets off NFC tags/public data.

Frontend-only deployment: https://vcard-moldova.vercel.app. It fails closed without backend configuration. M0–M4 implementation and local real-backend QA are available; M5 cloud acceptance is blocked by the above configuration.

## Known MVP limits (not hidden as completed)

- One account owns one profile of the type selected during registration. No multi-profile switcher or personal↔business migration UI.
- Public not-found is a branded SPA state; Vercel responds HTTP 200 to deep links. Server-rendered SEO/social-card metadata and HTTP-level 404 are not implemented.
- Public media is fetched through publication-checked RLS; public callers cannot mint signed URLs. Previously downloaded/copied bytes cannot be recalled. Owners deliberately signing/sharing their own media is not restricted.
- Replaced/removed/unsaved images remain private in Storage; implement a scheduled orphan cleanup/retention policy before high-volume use. Account deletion is an operator operation; its runbook must delete associated Storage files as well as the Auth user. Database records cascade; physical card IDs are retained disabled.
- MIME/size/ownership are server-enforced; image signature checks, pixel re-encoding, metadata stripping and dimension caps occur in the normal browser upload path. A malicious authenticated API client can bypass browser processing. A trusted image-processing service is a future hardening option.
- NFC limit is 10 attempts per account per 15 minutes. Supabase Auth supplies signup/login limits; CAPTCHA and broader IP/fraud controls need production configuration. No claim of a global/IP limiter is made.
- Optional signup activation is immediate only if signup returns a session. With email confirmation enabled, the user must enter the packaging code after confirming/logging in; secrets are intentionally not stored in metadata/browser storage.
- Preserve the original VCard logo/mark; no separate official brand asset was supplied.
- No external monitoring/alerting service, backup restore drill, legal/privacy/retention approval or custom domain/email sender configuration has been completed. These remain pre-public-launch operations, not blockers for local functional QA.
- With real Supabase configuration, the current single JavaScript entry is about 662 kB (195 kB gzip); Vite emits a >500 kB chunk advisory, not a build failure. Route-level splitting is deferred to keep this delivery focused on functional workflows.

## Final-review findings

Independent review completed; no Critical defect confirmed. All seven identified Important/Minor issues were fixed: public long-lived media signing, expired-recovery wrong-account risk, save-in-flight overwrite, dirty locale-switch overwrite, SQL/client URL/action schema mismatch, loose destructive-test hostname guard, and owner UUID disclosure in media references. The schema mismatch and test-host guard were treated as required fixes rather than deferrals. No review findings remain deferred. Cloud backend acceptance remains blocked as described above.
