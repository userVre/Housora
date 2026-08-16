import type { MetadataRoute } from "next";
import { toolConfigs } from "@/lib/tool-data";
import { blogPosts } from "@/lib/blog-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://housora.pages.dev";
  const paths = ["", "/examples", "/pricing", "/faq", "/contact", "/enterprise", "/blog", "/privacy", "/terms", "/cookies", "/refund-policy", ...Object.keys(toolConfigs).map((slug) => `/${slug}`), ...blogPosts.map((post) => `/blog/${post.slug}`)];
  return paths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : .7 }));
}
