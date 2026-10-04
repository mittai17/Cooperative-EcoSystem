"use client";

import { Sparkles, CheckCircle2 } from "lucide-react";
import { DemoLoginCard } from "@/components/auth/demo-login-card";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/i18n";

/** Evaluation pillars: title and detail are under public.demo.pillars.<key>. */
const EVALUATION_PILLARS = ["skillPassport", "offline", "institutional", "multiRole"];

export function DemoHubView() {
  const t = useT();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
          <Sparkles className="size-3.5" />
          {t("public.demo.badge")}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl font-heading">
          {t("public.demo.title")}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
          {t("public.demo.body")}
        </p>
      </div>

      {/* Main 1-Click Demo Login Card */}
      <div className="mb-12">
        <DemoLoginCard />
      </div>

      {/* Evaluator Guide Cards */}
      <div className="mt-12 border-t border-border pt-10">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground font-heading">
            {t("public.demo.guideTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t("public.demo.guideBody")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {EVALUATION_PILLARS.map((pillar) => (
            <Card key={pillar} className="border-border bg-card/60">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <h3 className="font-semibold text-sm text-foreground">{t(`public.demo.pillars.${pillar}.title`)}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(`public.demo.pillars.${pillar}.detail`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
