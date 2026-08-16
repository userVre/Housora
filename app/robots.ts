import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { const base = process.env.NEXT_PUBLIC_SITE_URL || "https://housora.pages.dev"; return { rules: { userAgent: "*", allow: "/", disallow: ["/app/", "/projects", "/design", "/delete-account", "/sign-in", "/sign-up"] }, sitemap: `${base}/sitemap.xml` }; }
