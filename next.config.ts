import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || process.env.EXPO_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || process.env.YOUR_WEBSITE_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.VITE_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || process.env.VITE_POSTHOG_HOST || process.env.POSTHOG_HOST,
  },
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2_592_000,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    const mappings = {
      "/create": "/design", "/subscription": "/pricing", "/workspace": "/design", "/app": "/app/home",
      "/floorplan-3d": "/floorplan-to-3d", "/stairs-design": "/ai-stairs-design", "/doors-design": "/ai-doors-design",
      "/windows-design": "/ai-windows-design", "/kitchen-design": "/ai-kitchen-design", "/bathroom-design": "/ai-bathroom-design",
      "/interior-design-examples": "/examples", "/inspirations": "/examples", "/referral": "/pricing",
      "/ai-interior-design-prompts": "/interior-design", "/furniture-fit-calculator": "/interior-design",
      "/fit-calculator": "/interior-design", "/prompt-generator": "/interior-design", "/answers": "/faq",
      "/api": "/contact", "/cli": "/contact", "/mcp": "/contact", "/partnerships": "/contact",
      "/embed-ai-interior-design": "/contact", "/case-studies": "/enterprise", "/affiliates": "/contact",
      "/affiliate": "/contact", "/b2b": "/enterprise", "/cookie-policy": "/cookies", "/creations": "/projects",
      "/refund": "/refund-policy",
    } as const;
    return Object.entries(mappings).map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
