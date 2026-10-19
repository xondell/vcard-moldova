# ADR-001: Preserve Vite and use scoped Supabase capabilities

## Status
Accepted — 2026-10-16

## Context
The original Vite/React prototype has valuable branding/templates but no trusted backend. The immediate goal is a functional cross-device demo, not a framework rewrite.

## Decision
Retain Vite and the existing visual structure. Supabase Auth owns account credentials; PostgreSQL owns persistence and access control. Core entity columns are relational; type-specific contact documents live in separate personal/business tables as bounded, server-validated JSONB. This keeps the existing discriminated frontend models without duplicating dozens of mapping columns.

Owner-only RLS protects table reads; direct browser writes are revoked. Narrow RPCs implement transactional saves and race-safe activation, check auth.uid() themselves, pin an empty search_path, and have least-privilege execute grants. Public read RPCs return only published contact data. Physical card identifiers never change; activation verifiers are separate SHA-256 hashes of 192-bit random secrets.

Private Storage requires ownership for uploads and a referenced, published profile for anonymous downloads. Opaque filenames do not disclose account UUIDs. Operation-aware RLS prevents anonymous/non-owner readers from minting signed bearer URLs. The app downloads bytes with Supabase authorization checks and renders local blob URLs; later downloads are denied immediately after unpublishing. Already downloaded/copied bytes cannot be recalled. Owners deliberately creating their own signed links are outside the publication revocation guarantee.

## Alternatives
- Next.js migration: rejected because it would consume time and risk visual regressions without replacing RLS/atomic DB operations.
- Browser localStorage: rejected because it cannot provide cross-device persistence or trusted ownership/activation.
- Service-role proxy for every call: rejected because owner-authenticated Supabase/RPCs need no service key in deployed frontend.

## Consequences
One account owns one profile of its chosen type in the MVP. Public pages are SPA pages; the branded 404 is a UI state, not an HTTP 404 response. JSONB fields are validated in SQL as well as TypeScript. Future typed-column migrations can be incremental. The SPA uses the official Supabase SDK's browser session persistence; an httpOnly BFF would require a different deployment/session architecture and is not claimed here.
