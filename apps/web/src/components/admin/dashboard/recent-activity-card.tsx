"use client";

import Link from "next/link";
import {
  CalendarDays,
  ArrowRight,
  Building2,
  GraduationCap,
  Users,
  Briefcase,
  CheckCircle2,
  FileText,
} from "lucide-react";

const ACTIVITIES = [
  {
    icon: Building2,
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    title: "New institution registered",
    subtitle: "Sahyadri Cooperative College, Pune",
    time: "2 minutes ago",
  },
  {
    icon: GraduationCap,
    iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
    title: "Trainer onboarded",
    subtitle: "Dr. Meera Shah",
    time: "12 minutes ago",
  },
  {
    icon: Users,
    iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    title: "Trainee certified",
    subtitle: "Amit Verma – Dairy Management",
    time: "35 minutes ago",
  },
  {
    icon: Briefcase,
    iconBg: "bg-rose-50 text-[#E30B1C] dark:bg-rose-950/50 dark:text-rose-400",
    title: "New job posted",
    subtitle: "Dairy Quality Analyst – Amul",
    time: "1 hour ago",
  },
  {
    icon: CheckCircle2,
    iconBg: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
    title: "Placement completed",
    subtitle: "Kiran Deshmukh – Quality Control Executive",
    time: "2 hours ago",
  },
  {
    icon: FileText,
    iconBg: "bg-rose-50 text-[#E30B1C] dark:bg-rose-950/50 dark:text-rose-400",
    title: "Assessment published",
    subtitle: "Cooperative Accounting – Module 2",
    time: "3 hours ago",
  },
];

export function RecentActivityCard() {
  return (
    <div className="flex flex-col justify-between h-full rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900 dark:text-foreground">
          <CalendarDays className="size-4.5 text-[#E30B1C]" />
          <span>Recent Activity</span>
        </h2>
        <Link
          href="/admin/audit-logs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#E30B1C] hover:underline"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* List */}
      <div className="flex flex-col divide-y divide-slate-100 dark:divide-border/60 my-auto">
        {ACTIVITIES.map((act, index) => {
          const Icon = act.icon;
          return (
            <div key={index} className="flex items-start justify-between gap-3 py-2.5 first:pt-1 last:pb-1">
              <div className="flex items-start gap-3 min-w-0">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${act.iconBg} mt-0.5`}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-xs font-bold text-slate-900 dark:text-foreground truncate">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-muted-foreground truncate mt-0.5">
                    {act.subtitle}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-[10px] text-slate-400 dark:text-muted-foreground whitespace-nowrap mt-0.5">
                {act.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
