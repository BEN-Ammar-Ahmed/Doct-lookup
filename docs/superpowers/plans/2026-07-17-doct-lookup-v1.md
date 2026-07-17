# Doct Lookup v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mobile-first Next.js site: pick insurance + ZIP, see real nearby doctors (live NPI registry) with deterministic demo insurance acceptance, list/map results, doctor profiles, name lookup.

**Architecture:** Next.js App Router. Browser → our API routes → NPI registry; server normalizes responses and stamps insurance plans via a pure deterministic function of the NPI number. Map pins from ZIP centroid (zippopotam.us, cached) + per-doctor offset. No database.

**Tech Stack:** Next.js 15 (TypeScript, App Router), plain CSS with design tokens, Leaflet + OpenStreetMap, Vitest.

## Global Constraints

- Mobile-first: all layouts designed at 375px; desktop = centered 430px column.
- Colors: primary `#0891B2`, CTA `#059669`, text `#164E63`, muted `#5B7A8A`, bg `#F7FCFD`, surface `#FFFFFF`, border `#D9EEF4`, danger `#DC2626`, badge bg `#E7F6F0`, badge text `#065F46`.
- Fonts: Figtree (headings) + Noto Sans (body) via `next/font/google`; body ≥16px.
- Icons: inline SVG (Lucide outline paths), never emoji. Sentence case copy.
- Touch targets ≥44px. Animations 150–300ms, transform/opacity only, gated by `prefers-reduced-motion`.
- Demo disclaimer visible on search footer, results, and profile: "Demo project — insurance data is illustrative."
- Insurers (id → name): `aetna` Aetna, `bcbs` Blue Cross Blue Shield, `cigna` Cigna, `uhc` UnitedHealthcare, `humana` Humana, `kaiser` Kaiser Permanente, `molina` Molina Healthcare, `ambetter` Ambetter, `medicare` Medicare, `medicaid` Medicaid.
- NPI registry: `GET https://npiregistry.cms.hhs.gov/api/?version=2.1` with `enumeration_type=NPI-1`, `limit=50`, plus `postal_code=` / `taxonomy_description=` / `first_name=`/`last_name=`/`state=`. Called server-side only.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `.gitignore`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (placeholder), `.claude/launch.json`

**Steps:**
- [ ] Write `package.json` (name `doct-lookup`, scripts: `dev`, `build`, `start`, `test`: `vitest run`) with deps `next@^15 react react-dom leaflet` and dev deps `typescript @types/node @types/react @types/react-dom @types/leaflet vitest`.
- [ ] `npm install` — expect clean install.
- [ ] `app/layout.tsx`: loads Figtree + Noto Sans via `next/font/google`, sets `<html lang="en">`, viewport meta, wraps children in `.phone-shell` (max-width 430px, centered, min-height 100dvh, bg `#F7FCFD`).
- [ ] `app/globals.css`: CSS variables for all Global Constraint colors (`--primary`, `--cta`, `--ink`, `--muted`, `--bg`, `--surface`, `--line`, `--danger`, `--ok-bg`, `--ok-ink`), base font 16px, `.btn-primary` (green, radius 14px, 48px tall), `.fld` input style, focus-visible rings, `@media (prefers-reduced-motion: reduce)` kill-switch.
- [ ] `app/page.tsx`: `<h1>Doct Lookup</h1>` placeholder.
- [ ] `.claude/launch.json`: `{ "version": "0.0.1", "configurations": [{ "name": "doct-lookup", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 3000 }] }`
- [ ] Verify: `npm run dev` boots and serves the placeholder.
- [ ] Commit: `feat: scaffold Next.js app with design tokens`

### Task 2: Insurance mapping (pure, tested)

**Files:**
- Create: `lib/insurers.ts`, `lib/insurance.ts`, `lib/insurance.test.ts`

**Interfaces:**
- Produces: `INSURERS: { id: string; name: string }[]` (10 entries, order per Global Constraints); `plansFor(npi: string): string[]` (3–6 insurer ids, deterministic); `fnv1a(s: string): number`.

- [ ] **Step 1: failing tests** (`lib/insurance.test.ts`):

```ts
import { describe, it, expect } from "vitest";
import { plansFor } from "./insurance";
import { INSURERS } from "./insurers";

describe("plansFor", () => {
  it("is deterministic", () => {
    expect(plansFor("1487654321")).toEqual(plansFor("1487654321"));
  });
  it("returns 3-6 valid insurer ids, no duplicates", () => {
    for (const npi of ["1000000001", "1234567893", "1487654321", "1999999999"]) {
      const plans = plansFor(npi);
      expect(plans.length).toBeGreaterThanOrEqual(3);
      expect(plans.length).toBeLessThanOrEqual(6);
      expect(new Set(plans).size).toBe(plans.length);
      const ids = INSURERS.map(i => i.id);
      for (const p of plans) expect(ids).toContain(p);
    }
  });
  it("varies across doctors", () => {
    const a = plansFor("1000000001").join(",");
    const b = plansFor("1222222222").join(",");
    const c = plansFor("1333333333").join(",");
    expect(a === b && b === c).toBe(false);
  });
});
```

- [ ] **Step 2:** `npx vitest run` → FAIL (module not found).
- [ ] **Step 3: implement**

```ts
// lib/insurers.ts
export const INSURERS = [
  { id: "aetna", name: "Aetna" },
  { id: "bcbs", name: "Blue Cross Blue Shield" },
  { id: "cigna", name: "Cigna" },
  { id: "uhc", name: "UnitedHealthcare" },
  { id: "humana", name: "Humana" },
  { id: "kaiser", name: "Kaiser Permanente" },
  { id: "molina", name: "Molina Healthcare" },
  { id: "ambetter", name: "Ambetter" },
  { id: "medicare", name: "Medicare" },
  { id: "medicaid", name: "Medicaid" },
] as const;

// lib/insurance.ts
import { INSURERS } from "./insurers";
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
export function plansFor(npi: string): string[] {
  const h = fnv1a(npi);
  const count = 3 + (h % 4);
  const start = fnv1a(npi + "s") % INSURERS.length;
  const stride = 1 + (fnv1a(npi + "t") % (INSURERS.length - 1));
  const picked: string[] = [];
  let idx = start;
  while (picked.length < count) {
    const id = INSURERS[idx % INSURERS.length].id;
    if (!picked.includes(id)) picked.push(id);
    idx += stride;
  }
  return picked.sort();
}
```

- [ ] **Step 4:** `npx vitest run` → PASS.
- [ ] **Step 5:** Commit `feat: deterministic demo insurance mapping`

### Task 3: NPI client + normalization

**Files:**
- Create: `lib/npi.ts`, `lib/npi.test.ts`, `lib/fixtures/npi-sample.json`

**Interfaces:**
- Produces: `type Doctor = { npi: string; name: string; specialty: string; address1: string; city: string; state: string; zip: string; phone: string | null; plans: string[]; lat: number | null; lng: number | null; distanceMi: number | null }`; `normalizeNpiResult(raw: any): Doctor | null`; `searchNpi(params: { zip?: string; specialty?: string; firstName?: string; lastName?: string; state?: string }): Promise<Doctor[]>`; `fetchNpiByNumber(npi: string): Promise<Doctor | null>`.

- [ ] Save one real NPI API response result object into `lib/fixtures/npi-sample.json` (fetch once during dev via `Invoke-RestMethod`, or hand-write matching the documented shape: `number`, `basic.first_name/last_name/credential`, `addresses[]` with `address_purpose "LOCATION"`, `taxonomies[]` with `primary: true`).
- [ ] Tests: normalization picks LOCATION address, primary taxonomy desc, title-cases name, attaches `plans: plansFor(npi)`, returns null for org records (`enumeration_type !== "NPI-1"` or missing basic.first_name).
- [ ] Implement `normalizeNpiResult`; `searchNpi` builds query (`postal_code` for zip, `taxonomy_description` for specialty, `last_name`/`first_name`/`state` for name mode, always `version=2.1&enumeration_type=NPI-1&limit=50`), fetches with 8s `AbortSignal.timeout`, maps + filters nulls. `fetchNpiByNumber` uses `number=` param.
- [ ] `npx vitest run` → PASS. Commit `feat: NPI registry client with normalization`

### Task 4: Geo (ZIP centroid, pins, distance)

**Files:**
- Create: `lib/geo.ts`, `lib/geo.test.ts`

**Interfaces:**
- Produces: `zipToLatLng(zip: string): Promise<{ lat: number; lng: number } | null>` (zippopotam.us, module-level cache, null on failure); `pinFor(npi: string, center: { lat: number; lng: number }): { lat: number; lng: number }` (deterministic offset ±0.008°); `milesBetween(a, b): number` (haversine, 1-decimal).

- [ ] Tests (pure parts only): `pinFor` deterministic + within 0.01° of center; `milesBetween` of identical points is 0 and NYC→LA ≈ 2445 ±50.
- [ ] Implement; `zipToLatLng` uses `https://api.zippopotam.us/us/{zip}`, caches in a `Map`, catches all errors → null.
- [ ] `npx vitest run` → PASS. Commit `feat: geo helpers`

### Task 5: API routes

**Files:**
- Create: `app/api/doctors/search/route.ts`, `app/api/doctors/[npi]/route.ts`

**Interfaces:**
- Produces: `GET /api/doctors/search?zip=&specialty=&insurance=&name=&state=` → `{ center: {lat,lng} | null, doctors: Doctor[] }` where each doctor has `lat/lng` (pin) and `distanceMi` filled when center known, sorted: accepted-plan matches first (when `insurance` given), then by distance. `GET /api/doctors/{npi}` → `{ doctor: Doctor | null }`.
- Consumes: Tasks 2–4 exports.

- [ ] Implement search route: validate zip `/^\d{5}$/` when present; name mode splits `name` into last/first tokens; on NPI fetch failure return 502 `{ error: "npi_unavailable" }`.
- [ ] Verify manually: `Invoke-RestMethod "http://localhost:3000/api/doctors/search?zip=60614&insurance=bcbs"` returns doctors with plans arrays.
- [ ] Commit `feat: doctor search and detail API routes`

### Task 6: Search screen

**Files:**
- Create: `components/Icons.tsx`, `components/SearchForm.tsx`; Modify: `app/page.tsx`

**Interfaces:**
- Produces: routes to `/results?mode=insurance&insurance=<id>&zip=<zip>&specialty=<s>` or `/results?mode=name&name=<q>&state=<st>`.

- [ ] `Icons.tsx`: small inline-SVG icon set (search, mapPin, phone, chevronDown/Left/Right, shieldCheck, list, map, check, x, stethoscope) as React components taking `size`/`className`.
- [ ] `SearchForm.tsx` (client): two-tab pill toggle ("By insurance" / "By doctor name"); insurance `<select>` from INSURERS; ZIP `<input inputMode="numeric" pattern="[0-9]*" maxLength={5}>` with inline validation error below field; specialty `<select>` (Any, Cardiology, Dermatology, Family Medicine, Internal Medicine, Pediatrics, Psychiatry, Obstetrics & Gynecology, Orthopaedic Surgery, Ophthalmology, Dentist); green CTA ≥48px. Name tab: text input + state `<select>` (50 states, optional). Submit → `router.push` to `/results`.
- [ ] `app/page.tsx`: brand header (cyan tile + wordmark), h1 "Find doctors who take your insurance", `<SearchForm/>`, footer disclaimer.
- [ ] Verify at 375px in browser preview. Commit `feat: search screen`

### Task 7: Results screen (list + map)

**Files:**
- Create: `app/results/page.tsx`, `components/ResultsClient.tsx`, `components/DoctorCard.tsx`, `components/ResultsMap.tsx`, `components/Skeleton.tsx`

**Interfaces:**
- Consumes: `GET /api/doctors/search`; Produces: card links to `/doctor/<npi>?insurance=<id>`.

- [ ] `ResultsClient` (client): reads search params; fetches on mount; states: loading (4 skeleton cards), error (message + retry button), empty (broaden-search actions incl. "Clear specialty"), data. List/Map segmented toggle. When `insurance` set: matches full-opacity with green "Accepts <name>" badge; non-matches after a "Nearby, different insurance" divider at 55% opacity. Client-side specialty re-filter chips. Staggered card entrance (CSS animation, 40ms steps), press feedback scale(0.98).
- [ ] `ResultsMap`: `dynamic(() => import(...), { ssr: false })`; Leaflet map, OSM tiles, `L.divIcon` SVG pins (cyan default, green selected), tap pin → bottom mini-card linking to profile. "Approximate locations" caption.
- [ ] Verify list + map with real search at 375px. Commit `feat: results list and map`

### Task 8: Doctor profile + polish + final verification

**Files:**
- Create: `app/doctor/[npi]/page.tsx`, `components/DoctorProfile.tsx`

- [ ] Profile: back link, initials avatar, name/specialty/NPI, green `tel:` call button, address card (link to `https://maps.google.com/?q=<addr>`), accepted-insurance chips (user's plan first + green; remaining insurers listed under "Not accepted" in red-tinted chips), small Leaflet map, disclaimer.
- [ ] Polish pass: focus rings everywhere, reduced-motion check, touch targets ≥44px, sentence case audit.
- [ ] Final verification: `npx vitest run` all green; drive full flow in phone-sized preview (search → list → map → profile → back; name lookup); screenshot each screen.
- [ ] Commit `feat: doctor profile and polish`

## Self-Review

- Spec coverage: search/results/map/profile/reverse-lookup ✓ (Tasks 6–8), insurance mapping ✓ (2), NPI live data ✓ (3), geo/pins ✓ (4), API ✓ (5), interactivity (skeletons, stagger, press, crossfade, autosuggest→simplified to instant filter chips + name mode) ✓ (7), error handling ✓ (5–7), tests ✓ (2–4), disclaimer ✓ (6–8).
- Deviation from spec (recorded): ZIP existence validated via geocode lookup at request time (zippopotam.us) instead of a bundled ZIP table; map degrades to list-only when geocode fails. Debounced autosuggest replaced by simple name search + instant specialty filter chips (YAGNI for v1).
- Placeholders: none. Type consistency: `Doctor` defined once in Task 3, consumed in 5–8 ✓.
