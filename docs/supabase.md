# Supabase integration handoff

The current Preview is a deliberately labeled local-demo fallback because no Supabase credentials were supplied. Registration, login, profile editing, publish toggles, QR and vCard actions are demonstrable with browser persistence, but this local state is not a production authentication system.

## Production sequence

1. Create a Supabase project and configure Auth email/password plus the Preview and production redirect URLs.
2. Add `profiles`, `personal_profiles`, `business_profiles`, `physical_cards`, and `activation_codes` tables with UUID ownership, unique normalized slugs, card statuses (`UNASSIGNED`, `ACTIVE`, `DISABLED`), timestamps, and indexes.
3. Enable Row Level Security. Owners may read/update only their own profile records. Public reads should use a safe published-profile view that excludes account metadata. Activation codes must never be publicly queryable.
4. Implement activation as an atomic server-side transaction or Postgres function: verify a hashed single-use code, mark it used, assign the card to the authenticated profile, and return only the public card identifier.
5. Add Supabase Storage buckets and ownership-scoped policies for personal avatars, business logos, and cover images. Validate MIME type and size server-side.
6. Replace the local `localStorage` adapter in `src/main.tsx` with Supabase Auth and typed data access. Keep the UI error states and demo fixtures as fallback content only.

No secrets belong in source control. The service-role key must remain server-only and never enter a browser bundle. Payments, subscriptions, physical inventory and direct NFC tag writing are intentionally out of scope for this MVP.
