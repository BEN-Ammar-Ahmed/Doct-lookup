# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mobile-first Next.js site: pick a health insurance + ZIP → see real nearby providers who accept it. Real provider data comes live from the US NPI registry; **insurance acceptance is demo data**, derived deterministically from each provider's NPI number (`lib/insurance.ts`). Never present it as real network participation — every screen carries a disclaimer, keep it that way.

## Commands

```bash
npm run dev        # dev server on :3000 (prefer the Claude preview launch config "doct-lookup")
npm test           # vitest run (unit tests live next to source in lib/*.test.ts)
npx vitest run lib/insurance.test.ts   # single test file
npx tsc --noEmit   # type check (no lint configured)
npm run build      # production build — stop the dev server first on Windows (.next lock)
```

## Architecture

The browser never calls external APIs. Client components fetch our own API routes, which orchestrate everything server-side:

- `app/api/doctors/search/route.ts` — zip mode (NPI registry by `postal_code` + geocode ZIP via zippopotam.us in parallel) or name mode (wildcard `last_name*`/`first_name*`). Stamps each doctor with map pin + distance, sorts insurance matches first.
- `app/api/doctors/[npi]/route.ts` — single provider by NPI number.
- `lib/npi.ts` — the only place that knows the NPI registry's raw shape. Normalizes its quirks: ALL-CAPS names, 9-digit ZIPs, LOCATION vs MAILING addresses, `--` credentials. Exports the `Doctor` type everything else consumes.
- `lib/insurance.ts` — `plansFor(npi)`: pure FNV-1a-hash walk over the 10 insurers in `lib/insurers.ts`. Deterministic (same NPI → same plans, always); tests enforce 3–6 plans. Don't add randomness.
- `lib/geo.ts` — ZIP → lat/lng (zippopotam.us, module-cached), deterministic per-NPI pin offset (~±0.008°), haversine distance. Pin locations are intentionally approximate; the UI says so.

Screen flow: `/` (landing) → `/search` (form, client-side routing via query params) → `/results?insurance=&zip=&specialty=` or `?name=&state=` → `/doctor/[npi]?insurance=`. Results and profile are client components that fetch on mount (skeletons while loading); pages wrap them in Suspense because of `useSearchParams`.

Leaflet must never render server-side — always `dynamic(() => import("./ResultsMap"), { ssr: false })`.

## Conventions

- **Mobile-first is a hard requirement.** The whole app renders inside `.phone-shell` (max 430px). Design and verify at 375px.
- All colors are CSS variables in `app/globals.css` (cyan `--primary`, green `--cta`, ink `--ink`...). No hardcoded hex in components — restyling must stay a one-file change.
- Icons are inline SVGs in `components/Icons.tsx` (Lucide outlines). No emoji as icons. Copy is sentence case.
- Animations: transform/opacity only, 150–300ms, and the `prefers-reduced-motion` kill-switch in globals.css must keep working.
- Design spec and implementation plan live in `docs/superpowers/`; update the spec when scope changes (it has an owner-approved screen list).
- NPI registry returns *all* licensed provider types (nurses, PTs, pharmacists) — the UI says "providers", not only "doctors"; the specialty filter narrows.
