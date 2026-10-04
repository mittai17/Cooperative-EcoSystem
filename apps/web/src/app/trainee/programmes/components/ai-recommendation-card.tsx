"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_TRAINEE_PROFILE } from "@/lib/services/eligibility-service";
import type { Programme } from "@/types/programme";
import { MOCK_PROGRAMMES } from "@/lib/mock-data/programmes-data";
import { useT } from "@/i18n";

export function AIRecommendationCard({ onExplore }: { onExplore: (p: Programme) => void }) {
  const t = useT();
  // Hardcode finding the most recommended one for the demo profile
  const recommendedProg = MOCK_PROGRAMMES.find((p) => p.id === "prog-pacs-accounting-002");

  if (!recommendedProg) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-sm">
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-primary/10 blur-2xl" />

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="size-4 text-primary" />
        <h3 className="font-heading text-sm font-bold text-foreground">{t("trainee.programmes.aiCardTitle")}</h3>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        {t("trainee.programmes.aiCardBefore")}{" "}
        <span className="font-semibold text-foreground">{DEMO_TRAINEE_PROFILE.occupation}</span>{" "}
        {t("trainee.programmes.aiCardWith")} <span className="font-semibold text-foreground">{t("trainee.programmes.aiCardYears").replace("{years}", String(DEMO_TRAINEE_PROFILE.experience))}</span>{" "}
        {t("trainee.programmes.aiCardExperience")}
      </p>

      <div className="rounded-xl border border-border bg-background p-3 mb-4">
        <p className="font-semibold text-sm line-clamp-2">{recommendedProg.title}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{t("trainee.programmes.aiCardDesc")}</p>
      </div>

      <Button size="sm" className="w-full h-8 text-xs" onClick={() => onExplore(recommendedProg)}>
        {t("trainee.programmes.exploreProgramme")} <ArrowRight className="size-3 ml-1" />
      </Button>
    </div>
  );
}
