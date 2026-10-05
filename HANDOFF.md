# InsureBased handoff — 2026-10-05

Current report: docs/REBRAND_RELEASE_REPORT.md. Earlier work and measured results are preserved in docs/EXECUTION_REPORT.md under the former Doct Lookup name. Follow AGENTS.md.

Workspace: C:/Users/ahmed/OneDrive/Desktop/Doct lookup. Routes, package name and infrastructure identifiers remain stable. Public UI, logo, favicon, manifest, metadata and legal/info pages now use InsureBased.

Latest verification: lint/typecheck/build pass; 49 unit tests; 22 browser tests. Mobile/desktop screenshots are in ignored artifacts/. The final local production preview is http://localhost:3000. Stop it before rebuilding into .next.

Git remains master at 665ba454352bc8d0e7563fd520f9bf91bd059f6a, with preserved earlier work and new changes uncommitted. The directive requires a working remote before committing. Origin still returns Repository not found; GitHub CLI token is invalid. Authenticate with gh auth login -h github.com and identify/grant access to the actual repository. Do not reset, clean, force-push or guess origin.

Vercel existing project doct-lookup was found through the connector, ID prj_VAa0A4MsyTOdEKRCwqwODlJs2P6r. SITE_URL was added for production as https://doct-lookup.vercel.app. Vercel CLI is logged out; use npx vercel login and link this existing project. No new deployment occurred; the public site still displays the old name. Do not create duplicates or disable deployment protection. Verify push/deployment, actual live flows, icons, console and production Lighthouse after authentication.

Missing Redis credentials now use bounded per-instance limiting; a configured store outage fails closed. This fallback is not a distributed quota. Live ACA needs a CMS key; optional database imports still require a real database and official source files. No credentials or source dumps were uploaded.

Original tracked and untracked work backups remain ignored. Secret-pattern scan found no working-tree or historical matches; scanning is heuristic. Preserve healthcare truth and never imply guaranteed coverage.
