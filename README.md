# InsureBased

A responsive provider-search website built with Next.js 15, React 19, TypeScript,
Leaflet, and public healthcare sources. Provider records are not appointment
listings. Confirm coverage with the provider and insurer before a visit.

## Run and verify

Requires Node.js 22 or newer and npm.

    npm ci
    npm run dev
    npm run lint
    npm run typecheck
    npm test
    npm run build
    npm start

For browser tests, install Chromium once and run against the running app:

    npx playwright install chromium
    npm run test:e2e

In this workspace Chromium is installed under the ignored artifacts/browsers
directory. Set PLAYWRIGHT_BROWSERS_PATH to that absolute directory when using
this installation. Other machines and CI can use Playwright's default cache.

Production prefers shared Redis protection. Without Redis credentials, a bounded
per-instance limiter allows searches to continue. This does not provide cross-instance
protection. A configured shared-store outage still fails closed.

## Routes

- /: server-rendered homepage, ZIP/specialty/coverage search.
- /search: detailed insurance, exact ACA plan, and provider-name search.
- /results: desktop filters/list/map; mobile and tablet List/Map controls.
- /doctor/[npi]: provider details, coverage, contact, source, and locations.
- /how-it-works, /data, /about, /privacy, /terms, /accessibility.
- /report: correction guide linking to official records. No report submissions.
- /robots.txt, /sitemap.xml: sitemap URLs emitted only with SITE_URL.

## Data and configuration

The homepage never waits for healthcare APIs or map initialization. Search
results do not bulk-geocode offices. Unmatched offices remain in the list
without invented pins or distances; users can request up to three address
matches. Maps and coverage failures leave the shell and provider list usable.

The optional PostgreSQL store supports official-data preprocessing. Without
DATABASE_URL, searches use the live NPI Registry. With it, searches use the
imported database; errors do not silently mix snapshots with live providers.

| Server-only variable | Purpose |
| --- | --- |
| SITE_URL | Verified public origin for sitemap, canonical and social metadata |
| DATABASE_URL | Read-only runtime PostgreSQL connection, preferably pooled |
| INGEST_DATABASE_URL | Separate privileged ingestion connection |
| UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN | Shared atomic rate limiter |
| CMS_MARKETPLACE_API_KEY | Free CMS Marketplace API credential |
| ALLOW_LOCAL_RATE_LIMIT | Legacy compatibility flag; fallback no longer requires opt-in |

Do not commit real environment values. See [brand/release report](docs/REBRAND_RELEASE_REPORT.md), [ingestion guide](docs/DATA_PIPELINE.md),
[decisions](docs/DECISIONS.md), and [execution report](docs/EXECUTION_REPORT.md).

## Insurance and provenance

Coverage wording is centralized in lib/coverage.ts. Original Medicare assignment
never implies Medicare Advantage network participation. Marketplace checks need
the exact plan ID and year; mismatched or missing plan IDs remain unknown.
Missing data, errors, and timeouts never become out-of-network claims.

NPPES record update dates and imported source dates appear only when real
metadata exists. Check times are lookup timestamps, not source refresh dates.
Source links do not imply government endorsement.

No accounts, advertising trackers, or session replay are used. Search parameters
can appear in URLs, browser history, and hosting request logs. The privacy page
describes external lookups and map tile requests.

## Project files

- app/: routes, shared layout, CSS, API handlers, error pages, metadata.
- components/: navigation, forms, provider cards, profiles, lazy map.
- lib/: source adapters, coverage labels, caching, validation, unit tests.
- db/schema.sql, scripts/ingest.mts: optional database and bulk importer.
- tests/e2e/: browser, responsive, error, and accessibility regressions.
- docs/: design rules, decisions, learning notes, verification report.
- artifacts/: ignored backups, screenshots, Lighthouse reports, browser.
- .github/workflows/check.yml: lint, typecheck, tests, build, browser checks.

Existing uncommitted work was preserved in the ignored
doct-lookup-pre-codex-working-tree.patch and
artifacts/pre-codex-untracked-source.zip. No remote push was performed.
