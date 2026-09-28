import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from "@/components/theme/theme-provider";
import { PWAProvider } from "@/components/offline/pwa-provider";
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
    default: "CoopSetu AI",
    template: "%s | CoopSetu AI",
  },
  description:
    "CoopSetu AI connects cooperative training directly to skills and employment through an AI-powered closed loop: registration, training, certification, job matching, and employer feedback in one ecosystem.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#E30B1C",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-dm-sans), sans-serif",
        },
        elements: {
          card: "border border-border shadow-lg",
          formButtonPrimary: "bg-primary hover:bg-primary-hover text-primary-foreground",
        },
      }}
    >
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
          <ThemeProvider>
            <TooltipProvider delay={150}>
              <PWAProvider>{children}</PWAProvider>
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
