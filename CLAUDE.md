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

- `app/api/doctors/search/route.ts` — zip mode (NPI registry by `postal_code` + geocode ZIP via zippopotam.us in parallel), name mode (wildcard `last_name*`/`first_name*`), or map-bounds mode (`lat`/`lng` reverse-geocoded to a ZIP via Nominatim). Geocodes provider office addresses before returning pins/distances, computes coverage per doctor, sorts covered matches first. Supports `skip` for pagination (`hasMore` in the response).
- `app/api/doctors/[npi]/route.ts` — single provider by NPI number, same coverage computation, and a profile map only when the office address geocodes.
- `app/api/insurance/marketplace/plans/route.ts` — real ACA plans for a ZIP + year, used by the search form's plan picker.
- `lib/npi.ts` — the only place that knows the NPI registry's raw shape. Normalizes its quirks: ALL-CAPS names, 9-digit ZIPs, LOCATION vs MAILING addresses, `--` credentials. Exports the `Doctor` type (no insurance field — coverage is computed per-search, not intrinsic to a doctor).
- `lib/medicare.ts` — real: batched query against CMS's public "Doctors and Clinicians" dataset (id `mj5m-pzi6`), field `ind_assgn`. `Y` → accepts Medicare-approved amount, `M` → maybe (verify before visit), anything else/missing → unable to verify. Always carries the Medicare-Advantage disclaimer. No API key needed.
- `lib/marketplace.ts` — real: CMS Marketplace API (`marketplace.api.healthcare.gov`). Requires `CMS_MARKETPLACE_API_KEY` (server-side env var only, see `.env.example`). `searchMarketplacePlans` looks up county FIPS for a ZIP then lists real plans; `checkMarketplaceCoverage` calls `/providers/covered` for a specific plan ID. Missing key or CMS errors degrade to a labeled "unavailable"/"not configured" state — never a fabricated answer.
- `lib/insuranceCheck.ts` — `computeCoverage(npis, query)`: the one place that dispatches to medicare/marketplace/other and returns a `Map<npi, CoverageDisplay>`. Both API routes call this so list and detail screens can never disagree.
- `lib/coverage.ts` — the shared `CoverageDisplay` shape every screen renders (`status`, `label`, `source`, `checkedAt`, ...). `coverageMarkerColor()` — green is reserved for `"covered"` only, everything else (including "we don't know") is neutral teal or rose.
- `lib/insurers.ts` — static list of well-known carrier names + their official homepage, used only by the "Other" category's picker/directory link. Does **not** drive any coverage answer.
- `lib/providerLocations.ts` — converts each provider's real NPI practice address into geocoder coordinates before the UI shows a map pin or distance. No synthetic pin fallback.
- `lib/geo.ts` — ZIP → lat/lng (zippopotam.us), lat/lng → ZIP (Nominatim reverse geocode), Census/Nominatim forward geocoding, and haversine distance.
- `lib/rateLimit.ts` — best-effort, per-instance in-memory rate limiting on API routes. Not shared across serverless instances — see comment in the file.
- `lib/validation.ts` — ZIP/NPI/plan-ID/plan-year validators shared by both API routes.
- `lib/searchParams.ts` — `buildSearchParams()`, the single source of truth for the search query string, used for both the initial load and "Load more" pagination so filters can't drift between pages.

Screen flow: `/` (landing) → `/search` (form: pick ACA Marketplace / Medicare / Other, ZIP, and for Marketplace a real plan) → `/results?category=&zip=&planId=...` or `?name=&state=&category=...` → `/doctor/[npi]?category=...`. Results and profile are client components that fetch on mount (skeletons while loading); pages wrap them in Suspense because of `useSearchParams`.

Leaflet must never render server-side — always `dynamic(() => import("./ResultsMap"), { ssr: false })`.

## Environment

`CMS_MARKETPLACE_API_KEY` — free key from https://developer.cms.gov/marketplace-api/key-request.html, expires every 60 days (CMS auto-emails a replacement). Only `lib/marketplace.ts` reads it; `lib/security.test.ts` asserts this stays true and that no "use client" file ever contains the string. Without it, ACA Marketplace search/coverage routes return a clear "not configured" error — the rest of the site (Medicare, Other, plain browsing) still works.

## Conventions

- **Design rules are part of the contract.** Use `docs/DESIGN_SYSTEM.md` before changing user-facing UI. The page should feel like a deliberately designed healthcare utility, not a generic AI-generated landing page.
- **Responsive is a hard requirement.** `.phone-shell` is the full-width app shell, not a phone mockup. Build mobile-first and verify at phone, tablet, and desktop widths (at minimum 375px, 768px, 1024px, and 1440px). No horizontal scroll, clipped text, or overlapping elements.
- Current visual direction: deep teal brand, pale blue clinical background, white/pale teal surfaces, coral `--cta` for primary actions, and green only for real positive coverage/status labels. Avoid purple/violet/indigo as the dominant hue, purple-blue gradients, glassy glow cards, emoji headings, fake stats, and generic SaaS sections. Keep edit-friendly tokens in `app/globals.css`.
- All colors are CSS variables in `app/globals.css` (teal `--primary`, coral `--cta`, rose `--danger`, ink `--ink`...). No hardcoded hex in components. Restyling must stay a one-file token change. Green is reserved for a real "covered" result; never reuse it for anything else.
- Icons are inline SVGs in `components/Icons.tsx` (Lucide outlines). No emoji as icons. Copy is sentence case.
- Animations: transform/opacity only, 150–300ms, and the `prefers-reduced-motion` kill-switch in globals.css must keep working.
- Design spec and implementation plan live in `docs/superpowers/`; update the spec when scope changes (it has an owner-approved screen list).
- NPI registry returns *all* licensed provider types (nurses, PTs, pharmacists) — the UI says "providers", not only "doctors"; the specialty filter narrows.
- Never fabricate location coordinates. If a provider office address does not geocode, leave `lat`/`lng` null and show no pin for that provider.
- Every coverage result shown in the UI must go through `CoverageDisplay` (`lib/coverage.ts`) — don't invent a new ad hoc "accepts/doesn't accept" shape in a component.
