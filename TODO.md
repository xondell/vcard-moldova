# VCard Moldova — Delivery Checklist

> Historical prototype checklist, retained for context. Superseded by `docs/IMPLEMENTATION_PLAN.md`, `HANDOFF.md` and `REMAINING_WORK.md`. Fake/demo persistence and Manus hosting requirements below no longer apply.

## Landing and brand
- [ ] Landing page includes branded header, Home / Features / How it works / Examples / FAQ navigation, login and create-card CTAs, RU/RO switcher, and mobile navigation.
- [ ] Hero communicates “Твоя визитка. Твои правила.” with supporting copy, primary and secondary CTAs, and an implemented profile-card preview.
- [ ] Landing page explains profile creation, customization, and sharing by link, QR, or NFC.
- [ ] Personal and business use cases, feature highlights, interactive demo switcher, NFC explanation, FAQ, Instagram footer link, and clearly labeled fictional examples are present.

## Localization and routes
- [ ] RU and RO interface dictionaries are implemented and language switching updates the visible UI.
- [ ] Public routes include `/`, `/ru`, `/ro`, `/ru/demo`, `/ro/demo`, `/p/[slug]`, and `/c/[cardId]`.
- [ ] Product routes include login, register, dashboard, profile editor, cards, and settings views for RU/RO.
- [ ] `public/manus-routes.json` stays synchronized with the page route set.

## Product interactions
- [ ] Registration and login screens include email, password, confirmation, profile type, and optional NFC activation code fields; demo fallback is clearly labeled when external auth is unavailable.
- [ ] Dashboard overview shows profile type, publication status, profile URL, QR destination, edit/copy/view actions, and NFC status.
- [ ] Profile editor supports editing core personal or business fields, save, live preview, publish/unpublish, and persistence in demo mode.
- [ ] QR destination can be copied and downloaded as PNG; personal profiles can download a UTF-8 vCard file.
- [ ] NFC card view communicates permanent `/c/[cardId]` URLs, active/unassigned/disabled states, and activation flow without exposing secrets.

## Quality and handoff
- [ ] Responsive layouts support 320–1440px without horizontal overflow.
- [ ] TypeScript diagnostics and production build pass.
- [ ] `.env.example` and `docs/supabase.md` document the remaining Supabase Auth/Postgres/Storage integration work and security requirements.
- [ ] No invented company details, testimonials, usage statistics, payments, NFT/blockchain features, or direct NFC-writing claims are included.
