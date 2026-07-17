# Doct Lookup — Design Spec

**Date:** 2026-07-17
**Status:** Approved direction (mockups reviewed by owner)

## What it is

A mobile-first website where a person picks their health insurance, enters a ZIP code, and sees real nearby doctors who accept that insurance. Built as a learning/portfolio project.

- Real doctors, live from the free NPI Registry API (`https://npiregistry.cms.hhs.gov/api/`) — no API key required.
- Insurance acceptance is **demo data**: derived deterministically from each doctor's NPI number across a fixed list of 10 major insurers, so the same doctor always shows the same plans. A visible disclaimer says the insurance data is illustrative.
- **Mobile-first is a hard requirement.** Every screen is designed for phones; desktop gets a centered column layout.

## Stack

- Next.js (App Router) with TypeScript.
- Leaflet + OpenStreetMap tiles for the map (free, no API key).
- No database — live API + in-code insurance mapping + bundled ZIP-code coordinate table.

## Design system (from ui-ux-pro-max: "Accessible & Ethical" healthcare style)

- Colors: primary `#0891B2` (cyan), CTA/accent `#059669` (health green), background `#ECFEFF`/white surfaces, foreground text `#164E63`, borders `#A5F3FC`/`#D9EEF4`, destructive `#DC2626`.
- Fonts: Figtree (headings), Noto Sans (body), 16px+ body text.
- Big touch targets (44px+), visible focus rings, WCAG AA contrast, `prefers-reduced-motion` respected.
- SVG icons (Lucide), never emoji. Sentence case everywhere.
- Anti-patterns to avoid: purple/pink AI gradients, cluttered nav, tiny text.

## Screens

1. **Search (home)** — two tabs: "By insurance" (insurance picker, ZIP input, optional specialty) and "By doctor name" (name + optional state). Single big green CTA. Demo disclaimer in footer.
2. **Results** — List/Map toggle. List: doctor cards (avatar initials, name, specialty, distance, address, green "Accepts X" badge); nearby doctors who don't accept the plan appear dimmed below matches. Map: Leaflet map with pins for matches; tapping a pin shows a mini card. Search summary pill at top returns to search.
3. **Doctor profile** — name, specialty, NPI, address, tap-to-call phone button, full accepted-insurance chips (user's plan highlighted green, not-accepted shown in red section), small map of the office location.
4. Reverse lookup reuses Results and Profile screens.

## Interactivity requirements

The site must feel app-like and alive, not like a static page:

- Skeleton loading cards while the API responds (never a blank screen or lone spinner).
- Animated transitions: list/map crossfade, card tap feedback (scale press), staggered card entrance (30–50ms).
- Debounced autosuggest on the doctor-name search.
- Instant client-side re-filtering when the specialty filter changes on results.
- Tap-to-call `tel:` links; tap address opens maps app.
- All animations 150–300ms, transform/opacity only, disabled under reduced motion.

## Architecture

```
Browser (phone)
  └─ Next.js pages (App Router, client components for search/results/map)
       └─ /api/doctors/search   → calls NPI Registry (by ZIP+specialty or name)
       └─ /api/doctors/[npi]    → single doctor detail
            └─ lib/insurance.ts → deterministic NPI→plans mapping (10 insurers)
            └─ lib/geo.ts       → ZIP→lat/lng table + per-doctor pin offset
```

- The browser never calls the NPI registry directly; our API routes normalize the messy NPI response into a clean `Doctor` shape: `{ npi, name, specialty, address, city, state, zip, phone, lat, lng, plans: string[] }`.
- Insurance mapping: stable hash of NPI number selects 3–6 plans from the insurer list. Pure function, unit-tested: same NPI in → same plans out, always.
- Map pins: ZIP centroid from a bundled ZIP→coordinates table, plus a small deterministic offset per NPI so pins don't stack.
- Insurer list: Aetna, Blue Cross Blue Shield, Cigna, UnitedHealthcare, Humana, Kaiser Permanente, Molina, Centene/Ambetter, Medicare, Medicaid.

## Error handling

- Invalid ZIP caught client-side before searching (5 digits, exists in ZIP table).
- NPI API error/timeout → friendly message + retry button.
- Zero results → "try a wider search" with one-tap actions (clear specialty filter).
- All error states designed, not left as blank screens.

## Testing

- Unit tests: insurance mapping (determinism, plan-count bounds), NPI response normalization (mocked fixtures), ZIP validation.
- Manual verification in phone-sized browser preview (375px) after each feature.

## Out of scope (v1)

- Real insurance acceptance data, accounts/login, reviews, appointment booking, non-US providers.
