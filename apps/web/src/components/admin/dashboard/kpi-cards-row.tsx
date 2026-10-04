"use client";

import { Award, Briefcase, Landmark, UserCheck, Users } from "lucide-react";
import { KpiCard, type KpiTone } from "@/components/admin/shared/kpi-card";
import type { DashboardKpis } from "@/lib/admin/admin-api";
import { formatCount } from "./format";

/** Deltas are "this month" changes from the API. A null delta hides the line rather than guessing. */
export function KpiCardsRow({ data }: { data: DashboardKpis }) {
  const items: {
    label: string;
    value: number;
    delta: number | null | undefined;
    icon: typeof Landmark;
    tone: KpiTone;
  }[] = [
    { label: "Institutions", value: data.institutions, delta: data.deltas.institutions, icon: Landmark, tone: "red" },
    { label: "Trainers", value: data.trainers, delta: data.deltas.trainers, icon: UserCheck, tone: "blue" },
    { label: "Trainees", value: data.trainees, delta: data.deltas.trainees, icon: Users, tone: "green" },
    { label: "Certified", value: data.certified, delta: data.deltas.certified, icon: Award, tone: "amber" },
    { label: "Employers", value: data.employers, delta: data.deltas.employers, icon: Briefcase, tone: "violet" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const hasDelta = item.delta !== null && item.delta !== undefined;
        return (
          <KpiCard
            key={item.label}
            icon={item.icon}
            tone={item.tone}
            value={formatCount(item.value)}
            label={item.label}
            delta={hasDelta ? `${formatCount(Math.abs(item.delta as number))} this month` : undefined}
            deltaTone={hasDelta && (item.delta as number) < 0 ? "down" : "up"}
          />
        );
      })}
    </div>
  );
}
