"use client";

import { Lightbulb, TrendingUp, ShieldCheck, Compass } from "lucide-react";
import type { AiInsight } from "@/lib/admin/admin-api";
import { cn } from "@/lib/utils";
import { DashboardPanel, EmptyState } from "./panel";

const TONES = [
  { icon: TrendingUp, tile: "bg-tint-green-bg text-tint-green-fg" },
  { icon: ShieldCheck, tile: "bg-tint-amber-bg text-tint-amber-fg" },
  { icon: Compass, tile: "bg-tint-blue-bg text-tint-blue-fg" },
];

export function AiInsightsCard({ insights }: { insights: AiInsight[] }) {
  return (
    <DashboardPanel icon={Lightbulb} title="AI Insights" className="h-full">
      {insights.length === 0 ? (
        <EmptyState message="No insights generated yet." />
      ) : (
        <ul className="flex flex-col gap-4">
          {insights.map((item, index) => {
            const tone = TONES[index % TONES.length];
            const Icon = tone.icon;
            return (
              <li key={item.title} className="flex items-start gap-3">
                <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", tone.tile)}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-snug text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}
