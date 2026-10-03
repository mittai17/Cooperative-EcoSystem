"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, TrendingUp, ShieldCheck, Compass } from "lucide-react";

const INSIGHTS = [
  {
    icon: TrendingUp,
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50",
    title: "Enrollment Growth",
    description:
      "Trainee enrollment is up 24% compared to last quarter, driven by increased demand in dairy and agri-business programs.",
  },
  {
    icon: ShieldCheck,
    iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/50",
    title: "Skill Demand Trend",
    description:
      "Employers are increasingly looking for Data Analytics, Quality Control, and Supply Chain skills.",
  },
  {
    icon: Compass,
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50",
    title: "Placement Opportunity",
    description:
      "215 active employers have posted 482 new jobs. Consider expanding industry partnerships.",
  },
];

export function AiInsightsCard() {
  return (
    <div className="flex flex-col justify-between h-full rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900 dark:text-foreground">
          <Sparkles className="size-4.5 text-[#E30B1C]" />
          <span>AI Insights</span>
        </h2>
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#E30B1C] hover:underline"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* 3 Insight items */}
      <div className="flex flex-col gap-3.5 my-auto">
        {INSIGHTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-start gap-3">
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${item.iconBg} mt-0.5`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-xs font-bold text-slate-900 dark:text-foreground leading-snug">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-muted-foreground leading-relaxed mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
