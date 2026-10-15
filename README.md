# VCard Moldova

A mobile-first MVP for digital business cards with personal and business profile demos, RU/RO interface switching, QR and vCard actions, and an auth-ready dashboard shell.

## Run locally

```bash
npm install
npm run dev
```

The app listens on port 3000. `npm run build` performs the production TypeScript and Vite build.

## Current scope

The managed Preview is intentionally usable without external credentials. It runs a clearly labeled local demo mode with browser persistence so product flows can be reviewed end-to-end. Supabase Auth, Postgres, Storage, server-side activation and RLS are documented in `docs/supabase.md` and `.env.example`.

## Routes

The public landing experience is available at `/`, `/ru`, and `/ro`. Auth-ready entry points live at `/{locale}/login` and `/{locale}/register`, with demo profile paths at `/{locale}/demo`, `/p/boris-colesov`, `/p/arina-studio`, and `/c/VC000123`. `/c/VC000999` demonstrates an active card resolving to the personal demo profile; `/c/VC000123` demonstrates an unassigned card. Dashboard paths exist for overview, profile, cards and settings in both locales.
