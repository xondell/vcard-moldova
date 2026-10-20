# Supabase implementation

The application uses the existing VCard Moldova Supabase project, Supabase Auth accounts, `profiles`, `personal_profiles`, `business_profiles`, `physical_cards`, and `activation_codes` tables. The additive migration stores editable profile content in `profiles.data`, preserves existing child-table content, and permits short numeric card IDs alongside legacy `VC...` identifiers.

The browser calls only same-origin `/api` endpoints. The Vercel function uses a server-only Supabase secret key. Account registration never accepts role or ownership assignments. Admin checks retrieve the current Auth user and inspect server-controlled `app_metadata.role` on every request. Password verification uses Supabase Auth, while the browser receives a separate opaque session cookie; its hash is stored in `vcard_sessions`. Logging out deletes the session immediately.

`vcard_sessions` and `vcard_rate_limits` have RLS enabled and no public policies: direct browser access is intentionally denied. Admin card creation, code replacement, activation and rate limiting use transactional RPCs with `SECURITY INVOKER` and EXECUTE granted only to `service_role`. The RPCs are inaccessible using the public browser key. Activation locks the code/card, checks unused/unassigned/enabled state, and assigns both owner and profile atomically. Card auto-numbering is serialized with a transaction advisory lock.

Public API responses expose only published profile content or card status. They never return code hashes, account passwords, session tokens or service keys. Deleting a physical card cascades its activation code through the existing foreign key. Database values and user input are rendered as React text; profile links are validated before use.

The migration expects the base VCard schema already installed. It is not a replacement initialization script for an empty Supabase project. Database backup and recovery remain managed by Supabase. Existing legacy RPCs and media policies are preserved.
