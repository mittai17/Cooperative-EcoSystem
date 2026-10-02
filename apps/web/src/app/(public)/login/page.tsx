import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { DemoLoginCard } from "@/components/auth/demo-login-card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          <Sparkles className="size-3.5" />
          CoopSetu AI Demo &amp; Production Access
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Choose Your Persona to Enter
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
          Explore CoopSetu AI as any of our 6 ecosystem roles. Select any persona below to log in instantly with full state and pre-populated data.
        </p>
      </div>

      <DemoLoginCard />

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 text-center sm:text-left">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Have credentials or custom credentials?</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log in through the standard authentication portal with your email.
          </p>
        </div>
        <Link className="contents" href="/sign-in"><Button variant="outline" size="sm"   nativeButton={false}>Standard Sign-In <ArrowRight className="ml-1.5 size-3.5" /></Button></Link>
      </div>
    </div>
  );
}
