# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mobile-first Next.js site: pick an insurance category + ZIP → see real nearby providers, with an honest insurance-coverage check where one actually exists. Provider data is always real, live from the US NPI registry. Insurance coverage is checked against real government data for two categories only — **ACA Marketplace plans** (CMS Marketplace API) and **Original Medicare** (CMS Doctors & Clinicians dataset) — everything else ("Other / employer insurance") is explicitly labeled "not verified," never guessed. There used to be a fake NPI-hash insurance generator (`lib/insurance.ts`); it was deleted. **Never reintroduce fabricated coverage answers** — if there's no real data source, the UI must say so, not guess.

## Commands

```bash
npm run dev        # dev server on :3000 (prefer the Claude preview launch config "doct-lookup")
npm test           # vitest run (unit tests live next to source in lib/*.test.ts)
npx vitest run lib/medicare.test.ts   # single test file
npx tsc --noEmit   # type check (no lint configured)
npm run build      # production build — stop the dev server first on Windows (.next lock)
```

## Architecture

The browser never calls external APIs or holds any API key. Client components fetch our own API routes, which orchestrate everything server-side:

- `app/api/doctors/search/route.ts` — zip mode (NPI registry by `postal_code` + geocode ZIP via zippopotam.us in parallel), name mode (wildcard `last_name*`/`first_name*`), or map-bounds mode (`lat`/`lng` reverse-geocoded to a ZIP via Nominatim). Stamps each doctor with map pin + distance, computes coverage per doctor, sorts covered matches first. Supports `skip` for pagination (`hasMore` in the response).
- `app/api/doctors/[npi]/route.ts` — single provider by NPI number, same coverage computation.
- `app/api/insurance/marketplace/plans/route.ts` — real ACA plans for a ZIP + year, used by the search form's plan picker.
- `lib/npi.ts` — the only place that knows the NPI registry's raw shape. Normalizes its quirks: ALL-CAPS names, 9-digit ZIPs, LOCATION vs MAILING addresses, `--` credentials. Exports the `Doctor` type (no insurance field — coverage is computed per-search, not intrinsic to a doctor).
- `lib/medicare.ts` — real: batched query against CMS's public "Doctors and Clinicians" dataset (id `mj5m-pzi6`), field `ind_assgn`. `Y` → accepts Medicare-approved amount, `M` → maybe (verify before visit), anything else/missing → unable to verify. Always carries the Medicare-Advantage disclaimer. No API key needed.
- `lib/marketplace.ts` — real: CMS Marketplace API (`marketplace.api.healthcare.gov`). Requires `CMS_MARKETPLACE_API_KEY` (server-side env var only, see `.env.example`). `searchMarketplacePlans` looks up county FIPS for a ZIP then lists real plans; `checkMarketplaceCoverage` calls `/providers/covered` for a specific plan ID. Missing key or CMS errors degrade to a labeled "unavailable"/"not configured" state — never a fabricated answer.
- `lib/insuranceCheck.ts` — `computeCoverage(npis, query)`: the one place that dispatches to medicare/marketplace/other and returns a `Map<npi, CoverageDisplay>`. Both API routes call this so list and detail screens can never disagree.
- `lib/coverage.ts` — the shared `CoverageDisplay` shape every screen renders (`status`, `label`, `source`, `checkedAt`, ...). `coverageMarkerColor()` — green is reserved for `"covered"` only, everything else (including "we don't know") is neutral teal or rose.
- `lib/insurers.ts` — static list of well-known carrier names + their official homepage, used only by the "Other" category's picker/directory link. Does **not** drive any coverage answer.
- `lib/geo.ts` — ZIP → lat/lng (zippopotam.us) and lat/lng → ZIP (Nominatim reverse geocode), both module-cached; deterministic per-NPI pin offset (~±0.008°) for the approximate map view; haversine distance.
- `lib/rateLimit.ts` — best-effort, per-instance in-memory rate limiting on API routes. Not shared across serverless instances — see comment in the file.
- `lib/validation.ts` — ZIP/NPI/plan-ID/plan-year validators shared by both API routes.
- `lib/searchParams.ts` — `buildSearchParams()`, the single source of truth for the search query string, used for both the initial load and "Load more" pagination so filters can't drift between pages.

Screen flow: `/` (landing) → `/search` (form: pick ACA Marketplace / Medicare / Other, ZIP, and for Marketplace a real plan) → `/results?category=&zip=&planId=...` or `?name=&state=&category=...` → `/doctor/[npi]?category=...`. Results and profile are client components that fetch on mount (skeletons while loading); pages wrap them in Suspense because of `useSearchParams`.

Leaflet must never render server-side — always `dynamic(() => import("./ResultsMap"), { ssr: false })`.

## Environment

`CMS_MARKETPLACE_API_KEY` — free key from https://developer.cms.gov/marketplace-api/key-request.html, expires every 60 days (CMS auto-emails a replacement). Only `lib/marketplace.ts` reads it; `lib/security.test.ts` asserts this stays true and that no "use client" file ever contains the string. Without it, ACA Marketplace search/coverage routes return a clear "not configured" error — the rest of the site (Medicare, Other, plain browsing) still works.

## Conventions

- **Mobile-first is a hard requirement.** The whole app renders inside `.phone-shell` (max 430px). Design and verify at 375px.
- All colors are CSS variables in `app/globals.css` (teal `--primary`, green `--cta`, rose `--danger`, ink `--ink`...). No hardcoded hex in components — restyling must stay a one-file change. Green is reserved for a real "covered" result; never reuse it for anything else.
- Icons are inline SVGs in `components/Icons.tsx` (Lucide outlines). No emoji as icons. Copy is sentence case.
- Animations: transform/opacity only, 150–300ms, and the `prefers-reduced-motion` kill-switch in globals.css must keep working.
- Design spec and implementation plan live in `docs/superpowers/`; update the spec when scope changes (it has an owner-approved screen list).
- NPI registry returns *all* licensed provider types (nurses, PTs, pharmacists) — the UI says "providers", not only "doctors"; the specialty filter narrows.
- Every coverage result shown in the UI must go through `CoverageDisplay` (`lib/coverage.ts`) — don't invent a new ad hoc "accepts/doesn't accept" shape in a component.
