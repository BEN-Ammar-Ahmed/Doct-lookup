import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
 const site = process.env.SITE_URL;
 return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/results", "/doctor/"] }, ...(site ? { sitemap: new URL("/sitemap.xml", site).href } : {}) };
}

