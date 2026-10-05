import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
 const site = process.env.SITE_URL;
 if (!site) return [];
 return ["/", "/search", "/how-it-works", "/data", "/about", "/privacy", "/terms", "/accessibility", "/report"].map(path => ({ url: new URL(path, site).href }));
}
