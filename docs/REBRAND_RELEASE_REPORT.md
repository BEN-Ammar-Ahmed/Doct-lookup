# InsureBased rebrand and release report — 2026-10-05

## Result

The InsureBased rebrand is implemented and verified locally. The production release is BLOCKED by authentication/access, not by the build. No new commit, push or production deployment occurred. The original directive requires a working remote before committing; that prerequisite is not satisfied.

Workspace remains C:/Users/ahmed/OneDrive/Desktop/Doct lookup. The folder, routes, database identifiers, environment names and technical package name remain stable.

## Brand and files

Updated shared header/footer, homepage copy, About/data/report/legal/error text, current README/handoff/CI name, titles, description and social metadata. Created components/Brand.tsx, app/manifest.ts, public/brand assets and optimized icons. Updated CSS only for compact logo treatment/navigation spacing, retaining the green/brass/ivory identity. About and footer identify InsureBased as an independent informational service, not an insurer, healthcare provider or government service.

Assets:
- public/brand/insurebased-mark.svg: 384-byte shield/cross/check icon.
- public/brand/insurebased-logo.svg: 560-byte full-color wordmark.
- public/brand/insurebased-logo-reversed.svg: light wordmark.
- public/brand/insurebased-logo.png: raster wordmark.
- public/brand/insurebased-social.png: 1200x630, about 48KB.
- public/brand/share.svg: editable social source.
- app/favicon.ico and public/favicon.ico: 16/32/48 sizes.
- public/apple-touch-icon.png: 180px.
- public/icon-192.png and icon-512.png, plus small 16/32/48 PNG exports.

Header/footer use a decorative SVG icon and one visible text wordmark. Browser tests verify icon responses, favicon relation, manifest identity, social site name and titles. Native bookmark UI and installation were not tested.

Metadata: InsureBased homepage/title template, description, Open Graph, Twitter, image alt text, icons and manifest. SITE_URL controls absolute canonical, social, robots, sitemap and WebSite/Organization schema. It was added to the existing Vercel project's production configuration as https://doct-lookup.vercel.app. No future domain is assumed. No insurer/medical organization schema is used.

Old-name references intentionally retained: original engineering report, July design/plan history, workspace path, Git remote, package/lockfile name, Vercel project/alias, launch configuration, existing backup filenames and Medicare client technical user-agent. No visible old brand remains in local rendered homepage/source UI.

Current implementation also changes missing-Redis behavior as requested: bounded per-instance limiting permits provider search without shared credentials; configured Redis failures still return 503. Unit tests verify the fallback blocks request 31. This does not provide distributed protection.

See docs/BRANDING.md for asset/use details. docs/REBRAND_WORKING_TREE.txt records the combined working-tree inventory, including earlier preserved work; it is not an attribution of every change to this rebrand. No source files were deliberately deleted. .vercelignore excludes credentials, private context, caches, artifacts, archives and temporary patches from uploads.

## Verification after rebrand

| Check | Result |
| --- | --- |
| npm run lint | PASS, zero errors/warnings |
| npm run typecheck | PASS |
| npm test | PASS, 49 tests / 11 files |
| npm run build | PASS, Next.js 15.5.27, 20 generated pages |
| npm run test:e2e | PASS, 22 tests, desktop/mobile, 2.9 minutes |
| git diff --check | PASS |
| File/history secret-pattern scan | No matches; no historical sensitive filename trees |
| Local rendered HTML | InsureBased title; no old brand; schema present; absolute canonical/social image |

Secret scanning is heuristic, not proof that all possible secret formats are absent. No secret values were printed. Only .env.example is tracked; real environment files and .vercel are ignored.

Screenshots: artifacts/insurebased-home-320-desktop.png, 375-mobile.png, 768-desktop.png, 1024-desktop.png, 1280-desktop.png and 1440-desktop.png (each has the insurebased-home- prefix). Six widths are checked in each Playwright project. No horizontal overflow was detected. Mobile and desktop screenshots were inspected. Existing mocked search/filter/pagination/profile/map/error/accessibility flows all still pass. Automated axe checks cover the tested homepage/results flow, excluding Leaflet.

## GitHub proof and blocker

- Configured repository: https://github.com/BEN-Ammar-Ahmed/Doct-lookup
- Branch: master.
- Current existing HEAD: 665ba454352bc8d0e7563fd520f9bf91bd059f6a.
- New commit: none.
- Push: BLOCKED; git ls-remote origin returns Repository not found.
- GitHub CLI account: AhmedBenAmmartun, stored token invalid.
- Connected GitHub app is authenticated as AhmedBenAmmartun, but cannot retrieve either the configured repository or AhmedBenAmmartun/Doct-lookup; installed repository search found no Doct repository.

These results do not establish whether the original repository is deleted, renamed, private or omitted from app access. No duplicate repository was created and origin was not guessed or changed. Repository creation is available only after authenticated access confirms absence.

Needed action: authenticate locally with gh auth login -h github.com, and supply the actual repository URL if it changed or grant the GitHub app access to the private repository. Keep tokens out of chat.

## Vercel proof and blocker

- Existing project: doct-lookup.
- Project ID: prj_VAa0A4MsyTOdEKRCwqwODlJs2P6r.
- Existing public URL: https://doct-lookup.vercel.app/.
- Existing latest production deployment ID: dpl_ER6vQPSVuvCdCaiqBgG3FFywSLd3, READY (the old version).
- New deployment: none; BLOCKED.
- No existing local .vercel link or usable Vercel CLI sign-in was found.
- CLI whoami reported logged out.
- Connected Vercel app can read/configure the existing project; no callable local-source deployment operation is exposed in this session.
- Automatic GitHub-to-Vercel deployment: not verified.
- No duplicate Vercel project was created; deployment protection was not disabled.
- Existing project environment listing was empty before SITE_URL was added. No working credentials were replaced.

Needed action: npx vercel login. Then link the existing project, not a new one, and deploy production after source push/verification.

## Live functionality and production measurements

A direct public request returned HTTP 200 and the old title, "Doct Lookup — find doctors who take your insurance"; InsureBased was absent. This confirms that the new local code is not deployed.

| Feature | Local verification | New live deployment |
| --- | --- | --- |
| Homepage / desktop / mobile | VERIFIED | BLOCKED |
| Search / filters / pagination | VERIFIED, mostly fixture flows | BLOCKED |
| Profiles / maps | VERIFIED local flows; source availability varies | BLOCKED |
| Medicare | VERIFIED unit/browser behavior; prior pass live positive source check | BLOCKED |
| ACA | PARTIAL: mocked exact-plan/error checks; no live key | BLOCKED |
| Footer / information / legal pages | VERIFIED | BLOCKED |
| Favicon / manifest / SEO metadata | VERIFIED resource responses and rendered metadata | BLOCKED |

Production Lighthouse mobile/desktop: NOT RUN for the new version because no new deployment exists. Local scores from the earlier engineering report are not production scores and are not re-used as rebrand measurements. Production console errors, deep-link refresh, live browser flows and NO_FCP resolution for the new version remain unverified. They must run after deployment; no success is claimed here.

The local production preview is http://localhost:3000. It runs the final build with the existing production origin configured for metadata and does not require Redis credentials to serve supported provider searches.
