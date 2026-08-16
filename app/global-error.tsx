"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html><body><main className="faq-page-section"><div className="faq-page-inner"><h1 className="faq-page-title">Something went wrong</h1><p className="faq-page-subtitle">Your data is safe. Please retry the page.</p><button className="btn-primary btn-large" onClick={reset}>Try again</button></div></main></body></html>;
}
