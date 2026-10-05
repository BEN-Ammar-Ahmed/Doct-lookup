# AI Learnings

- The owner wants design work to happen directly in this repo, not only through Canva or external mockups. Keep homepage copy, design tokens, and interaction behavior easy to locate and edit.
- The preferred UI direction is simple, polished, mobile-first, and healthcare-trustworthy. Avoid beige-heavy palettes, fake insurance claims, and over-animated decorative effects.
- Provider locations must be honest: use real NPI practice addresses and geocoder matches for pins/distances, and leave coordinates blank when geocoding fails instead of inventing offsets.
## 2026-10-05 production-readiness work

- Bundle fonts locally; next/font/google made builds depend on network access.
- Keep one CSS token/breakpoint system; stacked redesign overrides caused conflicts.
- Search must not wait for dozens of geocodes. Import matches or explicitly
  request a small batch, with no synthetic pins or distances.
- Bind ACA rows to the selected plan_id; missing/mismatched identities stay unknown.
- Paginate combined specialty results together; skipping every source by 50
  discards results from other specialties.
- Test hydrated interactions separately from server-only paint. SSR clicks can
  submit before handlers attach; tests must distinguish hydration from paint.
- Preserve cached check timestamps; source release dates are separate metadata.
- Production rate limiting needs shared state and visible configuration failures.
