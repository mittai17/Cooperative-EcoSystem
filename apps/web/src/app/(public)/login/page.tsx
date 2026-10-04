"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { DemoLoginCard } from "@/components/auth/demo-login-card";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

export default function LoginPage() {
  const t = useT();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          <Sparkles className="size-3.5" />
          {t("public.login.badge")}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("public.login.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
          {t("public.login.body")}
        </p>
      </div>

      <DemoLoginCard />

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 text-center sm:text-left">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{t("public.login.credentialsTitle")}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("public.login.credentialsBody")}
          </p>
        </div>
        <Link className="contents" href="/sign-in"><Button variant="outline" size="sm"   nativeButton={false}>{t("public.login.standardSignIn")} <ArrowRight className="ml-1.5 size-3.5" /></Button></Link>
      </div>
    </div>
  );
}
