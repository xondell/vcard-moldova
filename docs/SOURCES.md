# Implementation references

- Supabase JS v2 email signup, confirmation and PKCE: https://supabase.com/docs/reference/javascript/auth-signup
- Narrow database capabilities, explicit ownership, empty search_path and restricted execute grants: https://supabase.com/docs/guides/database/functions#security-definer-vs-invoker
- Owner-scoped Storage RLS: https://supabase.com/docs/guides/storage/security/access-control

Fetched and checked during implementation. Vite/React versions are pinned in package.json/lockfile. Supabase browser sessions use the official SPA SDK persistence (not the prototype's fake localStorage flag); database authorization never depends on a browser flag.
