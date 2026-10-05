# Architecture decisions

## 2026-10-05: render independently

The homepage is server-rendered with self-hosted fonts. Essential content never
depends on animations, healthcare APIs, maps, or trackers. Global errors retain
navigation; map-specific errors retain provider details.

## Responsive website

A 1440px container uses fluid gutters. At 1280px results show filters, list, and
map; 1024-1279px moves filters above list/map. Tablet and phone use List/Map and
an accessible inline filter disclosure. Public pages share header and footer.

## Source truth and identity

Coverage wording is centralized. Original Medicare assignment remains distinct
from Advantage participation. ACA rows must identify the requested plan.
Generic drug coverage is not positive provider participation. Cached check
timestamps and imported release dates remain distinct.

## Preprocessing and bounded fallbacks

Optional PostgreSQL replaces live search when configured. CSV sources are staged
and published atomically. No nationwide import was executed. Census geocoding
uses bounded successful-result caches and Next revalidation; searches never
geocode every office. Public Nominatim forward geocoding was removed; reverse
lookup remains a limited GPS convenience.

## Credentials and rate limits

Production prefers shared Redis. Configured-store failures return 503. Absent
credentials use bounded per-instance limiting so search remains available; this
cannot enforce a global quota across instances. No paid service was provisioned.
SITE_URL identifies the verified deployment origin.

## Security updates

Next was patched within 15.x; Vitest upgraded to 4.1.11; PostCSS overridden to
8.5.29. Remaining audit findings stem from the unpatched development-only braces
dependency in the Next lint chain. Do not downgrade framework linting or force a
framework major upgrade just to suppress an audit.
