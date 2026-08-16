"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import type { PostHog } from "posthog-js";
import { readConsent } from "@/lib/consent";

type Analytics = { capture: (event: string, properties?: Record<string, unknown>) => void };
const AnalyticsContext = createContext<Analytics>({ capture: () => undefined });

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const client = useRef<PostHog | null>(null);
  const pathname = usePathname();
  const { user } = useUser();

  const initialize = useCallback(async () => {
    if (client.current || !readConsent()?.analytics) return client.current;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key?.startsWith("phc_") || !host?.startsWith("https://")) return null;
    const { default: posthog } = await import("posthog-js");
    posthog.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_dead_clicks: false,
      capture_exceptions: false,
      capture_heatmaps: false,
      capture_performance: false,
      disable_session_recording: true,
      disable_surveys: true,
      person_profiles: "identified_only",
      persistence: "localStorage",
      respect_dnt: true,
    });
    client.current = posthog;
    return posthog;
  }, []);

  useEffect(() => {
    const handleConsent = async () => {
      if (readConsent()?.analytics) await initialize();
      else if (client.current) {
        client.current.reset();
        client.current.opt_out_capturing();
        client.current = null;
      }
    };
    window.addEventListener("housora:consent-changed", handleConsent);
    void handleConsent();
    return () => window.removeEventListener("housora:consent-changed", handleConsent);
  }, [initialize]);

  useEffect(() => {
    void initialize().then((posthog) => {
      posthog?.capture("$pageview", { $current_url: `${window.location.origin}${pathname}` });
    });
  }, [initialize, pathname]);

  useEffect(() => {
    if (!client.current) return;
    if (user) client.current.identify(user.id, { plan: "unknown" });
    else client.current.reset();
  }, [user]);

  const capture = useCallback((event: string, properties: Record<string, unknown> = {}) => {
    if (!readConsent()?.analytics) return;
    void initialize().then((posthog) => posthog?.capture(event, properties));
  }, [initialize]);

  return <AnalyticsContext.Provider value={{ capture }}>{children}</AnalyticsContext.Provider>;
}

export const useAnalytics = () => useContext(AnalyticsContext);
