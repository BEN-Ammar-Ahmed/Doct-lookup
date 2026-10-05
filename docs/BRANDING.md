# InsureBased branding

The working product name is InsureBased, formerly Doct Lookup. It is an independent provider-search and insurance-information service, not an insurer.

Assets under public/brand/:
- insurebased-mark.svg: 64-unit shield, medical cross and check, blue/teal.
- insurebased-logo.svg: full-color wordmark.
- insurebased-logo-reversed.svg: light wordmark for dark surfaces.
- insurebased-logo.png: compact raster wordmark.
- insurebased-social.png: 1200x630 social image.
- share.svg: editable social-image source.

Icons: app/favicon.ico and public/favicon.ico (16/32/48), public/apple-touch-icon.png (180), public/icon-192.png and icon-512.png; small PNG exports also retained. Navbar/footer use a 40px SVG mark with a visible text wordmark, decorative empty alt and no repeated accessible name. Mobile mark is 32px. Existing bottle-green/brass/ivory identity remains.

Routes, environment names, database identifiers, Redis key prefix, package name doct-lookup and physical workspace folder remain stable. Historical execution and July design/plan reports retain their original brand and represent earlier work. Existing backups and source archives retain original filenames.

Metadata includes InsureBased titles, description, Open Graph/Twitter, social image, favicon, apple icon, manifest and environment-based canonical/robots/sitemap URLs. Homepage WebSite and publisher Organization schema is emitted only with SITE_URL; no insurer or medical organization schema is claimed. No future domain availability or ownership is assumed.

The production project is still named doct-lookup. Its existing public alias is https://doct-lookup.vercel.app. SITE_URL was added to the existing Vercel project's production configuration; no credentials were overwritten.

Production rate limiting now has a bounded per-instance fallback when Redis credentials are absent, as requested for graceful launch. A configured Redis failure still fails closed. The fallback cannot enforce a distributed quota.
