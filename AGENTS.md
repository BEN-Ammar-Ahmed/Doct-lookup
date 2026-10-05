# Project agent instructions

Preserve user work. Read README.md and docs/DECISIONS.md before substantial changes.
Never commit credentials, source dumps, backups, or browser artifacts.

Commands: npm run lint, npm run typecheck, npm test, npm run build.
Browser checks: start the built app, install Playwright Chromium, npm run test:e2e.
This workspace's Chromium is installed under artifacts/browsers.

Do not run next dev and next build against the same .next directory simultaneously.
Production prefers shared Redis; absent credentials use bounded per-instance limiting.

Keep source dates distinct from lookup times. Unknown never means out of network.
Match ACA plan_id to the selected plan. Never invent healthcare or freshness data.

Keep the server-rendered homepage visible without JavaScript, external API calls,
or entrance animations. Maintain the single responsive CSS token system.
