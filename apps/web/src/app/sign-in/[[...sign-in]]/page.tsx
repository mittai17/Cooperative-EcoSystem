
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DemoLoginCard } from "@/components/auth/demo-login-card";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      {/* Top Header */}
      <div className="mx-auto w-full max-w-6xl flex items-center justify-between pb-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Home
        </Link>
      </div>

      {/* Main Grid: Demo 1-Click Login (Featured) + Clerk Auth */}
      <div className="mx-auto w-full max-w-6xl my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 1-Click Demo Login */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <DemoLoginCard />
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="mx-auto w-full max-w-6xl pt-8 text-center text-xs text-muted-foreground">
        CoopSetu AI &middot; National Cooperative Skilling &amp; Placement Platform &middot; SIH 2026
      </div>
    </div>
  );
}
