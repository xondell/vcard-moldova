# VCard Moldova — Implementation Plan

> Historical prototype plan. Current implementation uses real Supabase, React Router and independent Vercel hosting; see `docs/MVP_SPEC.md`, `docs/IMPLEMENTATION_PLAN.md` and `HANDOFF.md`. The localStorage/Manus behavior described below is no longer used.

## Scope
Build a commercial-feeling MVP for VCard Moldova: a mobile-first digital business card product with personal/business demos, Russian/Romanian UI, public profile routes, QR and vCard actions, and an auth-ready dashboard shell. The first delivery prioritizes verified user flows that work without external credentials while keeping the Supabase seams clear for production wiring.

## Implementation approach
- **Frontend:** Vite + React + TypeScript with a small route-aware shell instead of a heavyweight router, keeping Preview fast and the code easy to hand off.
- **State:** localStorage-backed demo account/profile state to make registration, editing, publish toggles, URL copying, QR download, and vCard download demonstrable in managed Preview. This is explicitly documented as a demo fallback, not a replacement for Supabase Auth.
- **Backend seams:** `src/lib/product.ts` owns profile/card models and helpers. Supabase migration/auth/storage work is documented in `docs/supabase.md` and `.env.example` for the next backend milestone.
- **Internationalization:** compact RU/RO dictionaries with a locale-aware `t()` helper; user-authored profile copy remains in its original language.
- **Public product behavior:** `/p/[slug]` renders the profile view; `/c/[cardId]` renders a permanent NFC/QR resolver state and demo active card; `/ru/demo` and `/ro/demo` open the demo profile.
- **Verification:** TypeScript diagnostics, `npm run build`, route manifest fetch, and managed Preview screenshots at desktop/mobile sizes.

## Design direction
- **Style options:** Neo-editorial SaaS (<0.07); Warm modernist studio (<0.08); **Signal-led product minimalism (<0.05, chosen).**
- **Design Movement:** signal-led product minimalism: editorial navy structure with one high-visibility yellow action color.
- **Core Principles:** clarity before decoration; confident hierarchy; touch-friendly actions; product UI as the hero artwork.
- **Color Philosophy:** deep navy communicates trust and permanence; yellow is the “signal” that moves a user from discovery to action; soft sand and pale blue surfaces keep dense information approachable.
- **Layout Paradigm:** asymmetric split-screen hero, diagonal signal accents, and stacked content bands rather than a generic centered SaaS grid.
- **Signature Elements:** yellow signal dot/line motif, large rounded profile preview, compact navy rail labels.
- **Interaction Philosophy:** every interactive control explains the next action; cards lift slightly on hover; tabs and toggles have visible state.
- **Animation:** small translate/fade entrances, 180–240ms hover transitions, no looping motion that competes with content.
- **Typography System:** Inter for interface and body copy; strong 56–74px hero display with tight tracking; 11–13px uppercase eyebrow labels; 16px minimum body copy.
- **Brand Essence:** a permanent, elegant identity layer for people and places that want to be remembered — **direct, useful, optimistic**.
- **Brand Voice:** direct, friendly, non-hyped. Example lines: “Твоя визитка. Твои правила.” and “Один профиль — все способы быть на связи.”
- **Wordmark & Logo:** temporary text wordmark for the MVP: navy rounded mark with a yellow signal dot and “VCard”; replace with supplied official logo asset when available.
- **Signature Brand Color:** VCard Signal Yellow `#FCCC08`.

## Project structure
- `src/main.tsx` — app shell, route handling, views, interactions.
- `src/lib/product.ts` — demo profile/card data, helpers, QR/vCard behavior.
- `src/styles.css` — responsive design system and component styling.
- `public/manus-routes.json` — route manifest for managed Preview.
- `docs/supabase.md` — production auth/database/storage integration notes.
- `.env.example` — documented future environment variables.
- `TODO.md` — acceptance-driven status list.

## Product decisions and constraints
- No blockchain/NFT functionality.
- No fabricated testimonials, customer counts, addresses, or legal details.
- A clear “demo mode” label appears in the product UI where local persistence is used.
- Payment, subscriptions, physical card inventory, and direct NFC writing are future milestones.
