# Supabase operations

## Schema installation

Use a fresh, dedicated VCard project. The following changes only that project's database:

```bash
supabase login
supabase link --project-ref YOUR_VCARD_PROJECT_REF
supabase db push
```

Enter that database's password when requested; do not put passwords in shell history. Alternatively apply the five migration files in filename order using the SQL editor, once per fresh project. CLI migration history is preferred. Local verification uses `supabase start`; **never run `supabase db reset --linked` on production**.

Migrations:
1. `202610160001_foundation.sql`: profiles and personal/business details, cards, secret verifiers, RLS, auth profile creation and user-deletion card detachment.
2. `202610160002_profile_api.sql`: bounded server validation, transactional owner saves, safe public read functions.
3. `202610160003_nfc.sql`: operator provisioning, persistent attempt limits, locking/single-use activation, resolver and owner card status changes.
4. `202610160004_storage.sql`: private 5 MB raster-image bucket and owner/publication-scoped policies.
5. `202610160005_review_hardening.sql`: operation-scoped public downloads (no public URL signing), opaque media names/ownership checks, URL-port and action-schema consistency. Requires Storage operation-aware helpers; verified against the local stack's Storage v1.70.3. Cloud setup must apply all five migrations before allowing uploads/public traffic.

One account gets one profile at registration. Account metadata stores only the chosen profile type, never an activation code. All direct browser table writes are revoked. Browser table reads are owner-scoped; public RPCs return only published contact documents. Activation hashes and attempt records have no client grants.

## Auth configuration

- Enable email/password; minimum password length 8 (UI accepts 8–128).
- Set Site URL to the actual frontend HTTPS origin.
- Add exact redirect origins/paths, including `/ru/dashboard`, `/ro/dashboard`, `/ru/reset-password`, `/ro/reset-password`. Preview URLs need their own allowlist entries; avoid broad wildcards in production.
- Configure confirmation email and a working SMTP sender before inviting real users. Local auto-confirm exists only for isolated tests; Mailpit receives local recovery emails.
- Keep Supabase Auth rate limits enabled. For a public launch enable CAPTCHA/abuse controls as appropriate; NFC has a separate persisted authenticated limiter.
- SPA sessions are persisted by the official Supabase client; dashboard authorization is enforced again inside database RPCs/RLS.

## Storage

`profile-media` is private, max 5 MiB, JPEG/PNG/WebP only. Objects use opaque `random_uuid.webp` names; Storage owner_id and profile-save validation enforce ownership. Frontend checks file signatures, decodes and re-encodes raster images, strips metadata and scales to 1800px. Server bucket limits and RLS remain authoritative for type/size/ownership; a malicious authenticated API client can bypass browser re-encoding, so downstream consumers must not trust original file bytes. SVG uploads are denied.

Anonymous access requires the exact object path to be referenced by a published profile. Public RLS permits only authenticated-object download/info operations, not signing or listing. The frontend renders downloaded blobs instead of issuing bearer URLs; unpublishing blocks subsequent downloads. Previously downloaded bytes cannot be recalled, and owners can intentionally distribute their own media. Unsaved/replaced objects are not public. Old uploads are retained privately; add lifecycle cleanup before heavy production use. Owner deletes and account deletion require a storage cleanup runbook (see remaining work). A pre-release installation of migration 004 alone could have issued long-lived public signed URLs; do not expose that intermediate schema, and rotate the Storage signing secret if it was previously exposed with real data.

## RPC API

- `get_owned_profile()`: authenticated caller's profile plus its ID/publication state.
- `save_profile(profile_slug, profile_data, is_published)`: saves only caller's profile atomically; no client-supplied owner ID.
- `get_public_profile(profile_slug)`: published contact JSON or null; no private account IDs.
- `provision_card(card_public_id, verifier)`: service-role-only inventory creation, both records in one transaction.
- `activate_card(activation_code, target_profile)`: authenticated owner, returns `{public_id}` or generic `{error}`; limiter increments survive invalid claims.
- `resolve_card(card_public_id)`: active + published slug, unassigned, unavailable, or null for unknown.
- `set_card_enabled(card_id, enabled)`: changes status only for caller-owned activated cards.

## Rollback / launch safety

Do not drop schemas or reverse migrations containing user data. These migrations are additive for a fresh project. On an application regression, roll Vercel back to the last verified deployment and disable public traffic while fixing forward. Do not restore the old fake-auth prototype as a production backend. Take managed database backups before subsequent schema changes and test restore procedures before a public launch.
