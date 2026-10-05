# Design system

Bottle green #173e35, brass #806326, ivory #faf8f1, restrained white surfaces.
Fraunces headings and Inter UI/body are bundled locally with display: swap.

Tokens and responsive rules live in app/globals.css. Container maximum: 1440px.
Gutters: 16px-56px. Controls: at least 44px. Fields: 16px type, visible focus,
associated errors.

- Below 768px: compact menu, stacked search/profile/footer.
- 768-1023px: two-column search fields; List/Map results.
- 1024-1279px: horizontal search, simultaneous list/map; filters above.
- 1280px and wider: filter sidebar, results, map; multi-column footer.

Use cards for provider records and search controls, sections and dividers for
ordinary content. Never hide the hero or forms behind entrance animations.
Only skeletons use loading motion; reduced motion disables it.

Show only real source dates. Map matches are approximate. Details remain usable
without maps. Green coverage labels require source-backed positive results.
