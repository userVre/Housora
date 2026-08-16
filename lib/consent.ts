export const CONSENT_KEY = "housora-consent-v3";
export const CONSENT_VERSION = 3;
export const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;

export type ConsentChoice = {
  necessary: true;
  analytics: boolean;
  version: number;
  timestamp: number;
  expiresAt: number;
};

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(CONSENT_KEY) || "null") as ConsentChoice | null;
    if (!value || value.version !== CONSENT_VERSION || value.expiresAt <= Date.now()) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean): ConsentChoice {
  const timestamp = Date.now();
  const value: ConsentChoice = {
    necessary: true,
    analytics,
    version: CONSENT_VERSION,
    timestamp,
    expiresAt: timestamp + CONSENT_LIFETIME_MS,
  };
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("housora:consent-changed", { detail: value }));
  return value;
}
