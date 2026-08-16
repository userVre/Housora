import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://housora.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Housora - AI Room Design", template: "%s | Housora" },
  description: "Explore practical AI design concepts for your home from a photo.",
  applicationName: "Housora",
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
  openGraph: { siteName: "Housora", type: "website", images: ["/og-image.png"] },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          <AppProviders>{children}</AppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
