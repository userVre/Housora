import { blogPosts } from "@/lib/blog-data";
import { toolConfigs } from "@/lib/tool-data";

export const dynamic = "force-static";

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://housora.pages.dev";
  const lines = [
    "# Housora",
    "",
    "> Housora helps people explore AI-assisted design concepts based on photos of their own spaces.",
    "",
    "## Core pages",
    `- [Home](${base}/)`,
    `- [Examples](${base}/examples)`,
    `- [Pricing](${base}/pricing)`,
    `- [FAQ](${base}/faq)`,
    "",
    "## Design tools",
    ...Object.keys(toolConfigs).map((slug) => `- [${toolConfigs[slug].title}](${base}/${slug})`),
    "",
    "## Guides",
    ...blogPosts.map((post) => `- [${post.title}](${base}/blog/${post.slug})`),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
