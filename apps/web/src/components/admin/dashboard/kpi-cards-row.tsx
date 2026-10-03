"use client";

import { Landmark, User, Users, Award, Briefcase } from "lucide-react";
import { formatCount } from "./format";

interface KpiData {
  institutions: number;
  trainers: number;
  trainees: number;
  certified: number;
  employers: number;
  deltas: {
    institutions: number;
    trainers: number;
    trainees: number;
    certified: number;
    employers: number;
  };
}

export function KpiCardsRow({ data }: { data: KpiData }) {
  const cards = [
    {
      label: "Institutions",
      value: formatCount(data.institutions),
      delta: `↑ ${formatCount(data.deltas.institutions)} this month`,
      icon: Landmark,
      iconBg: "bg-rose-50 text-[#E30B1C] dark:bg-rose-950/50 dark:text-rose-400",
    },
    {
      label: "Trainers",
      value: formatCount(data.trainers),
      delta: `↑ ${formatCount(data.deltas.trainers)} this month`,
      icon: User,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    },
    {
      label: "Trainees",
      value: formatCount(data.trainees),
      delta: `↑ ${formatCount(data.deltas.trainees)} this month`,
      icon: Users,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    {
      label: "Certified",
      value: formatCount(data.certified),
      delta: `↑ ${formatCount(data.deltas.certified)} this month`,
      icon: Award,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    },
    {
      label: "Employers",
      value: formatCount(data.employers),
      delta: `↑ ${formatCount(data.deltas.employers)} this month`,
      icon: Briefcase,
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-2xs hover:shadow-xs transition-shadow"
          >
            <div>
              <span className={`flex size-10 items-center justify-center rounded-full ${c.iconBg}`}>
                <Icon className="size-5" />
              </span>
              <div className="mt-4">
                <p className="font-heading text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-foreground">
                  {c.value}
                </p>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-muted-foreground mt-0.5">
                  {c.label}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>{c.delta}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
