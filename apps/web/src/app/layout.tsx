import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { PWAProvider } from "@/components/offline/pwa-provider";
import { I18nProvider } from "@/i18n";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NURVEX",
    template: "%s | NURVEX",
  },
  description:
    "NURVEX connects cooperative training directly to skills and employment through an AI-powered closed loop: registration, training, certification, job matching, and employer feedback in one ecosystem.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64 32x32 24x24 16x16" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/brand/nurvex-icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/brand/nurvex-icon-192.png", type: "image/png", sizes: "192x192" },
    ],
  },
  openGraph: {
    title: "NURVEX",
    description:
      "NURVEX connects cooperative training directly to skills and employment through an AI-powered closed loop: registration, training, certification, job matching, and employer feedback in one ecosystem.",
    siteName: "NURVEX",
    images: [{ url: "/brand/nurvex-icon-512.png", width: 512, height: 512, type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${dmSans.variable} ${jakarta.variable} ${plexMono.variable} h-full antialiased`}
      >
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#E30B1C" />
        </head>
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <I18nProvider>
            <ThemeProvider>
              <TooltipProvider delay={150}>
                <PWAProvider>{children}</PWAProvider>
              </TooltipProvider>
            </ThemeProvider>
          </I18nProvider>
        </body>
      </html>
    </>
  );
}
