import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "InsureBased", short_name: "InsureBased", description: "Find doctors. Understand coverage.", start_url: "/", display: "standalone", theme_color: "#173e35", background_color: "#faf8f1", icons: [
    { src: "/icon-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ] };
}
