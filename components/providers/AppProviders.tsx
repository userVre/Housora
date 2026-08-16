"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useState } from "react";
import { AnalyticsProvider } from "@/components/privacy/AnalyticsProvider";
import { CookieConsent } from "@/components/privacy/CookieConsent";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [convex] = useState(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    return url ? new ConvexReactClient(url.replace(/\/+$/, "")) : null;
  });

  const content = (
    <AnalyticsProvider>
      {children}
      <CookieConsent />
    </AnalyticsProvider>
  );

  return convex ? (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>{content}</ConvexProviderWithClerk>
  ) : content;
}
