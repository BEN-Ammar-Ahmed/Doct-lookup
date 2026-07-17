# Doct Lookup

A mobile-first website that answers one question: **which doctors near me take my insurance?**

Pick your health insurance, enter a ZIP code, and see real nearby providers — live from the US government's public NPI registry — with list and map views, provider profiles, tap-to-call, and a reverse lookup by doctor name.

> **Demo data note:** provider names, specialties, addresses, and phone numbers are real (public NPI registry). Insurance acceptance is *illustrative*: it's generated deterministically from each provider's NPI number, so it's stable and consistent, but it is not real network participation data.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests (vitest)
```

## How it works

```
Browser (phone)
  └─ Next.js pages (App Router)
       └─ /api/doctors/search   → NPI registry (by ZIP + specialty, or by name)
       └─ /api/doctors/[npi]    → single provider detail
            ├─ lib/insurance.ts → deterministic NPI → plans mapping (10 insurers)
            ├─ lib/npi.ts       → NPI response normalization
            └─ lib/geo.ts       → ZIP geocoding (zippopotam.us) + map pin placement
```

- The browser never calls external APIs directly; our API routes normalize everything into one clean `Doctor` shape.
- Map pins are approximate: ZIP centroid plus a stable per-provider offset.
- Stack: Next.js 15 + TypeScript, plain CSS design tokens, Leaflet + OpenStreetMap, Vitest.

## Project docs

- Design spec: `docs/superpowers/specs/2026-07-17-doct-lookup-design.md`
- Implementation plan: `docs/superpowers/plans/2026-07-17-doct-lookup-v1.md`
