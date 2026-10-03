"use client";

import Link from "next/link";
import { Landmark, ArrowRight, Star, Building2, Shield, School } from "lucide-react";

const INSTITUTIONS = [
  {
    rank: 1,
    name: "VAMNICOM",
    state: "Pune, Maharashtra",
    trainees: "1,240",
    trainers: 68,
    rating: 4.8,
    badgeBg: "bg-[#1E293B] text-white",
    icon: Building2,
  },
  {
    rank: 2,
    name: "Amul Dairy Training Centre",
    state: "Anand, Gujarat",
    trainees: "980",
    trainers: 54,
    rating: 4.7,
    badgeBg: "bg-[#E30B1C] text-white",
    icon: Landmark,
  },
  {
    rank: 3,
    name: "NCDC Training Institute",
    state: "New Delhi",
    trainees: "860",
    trainers: 42,
    rating: 4.6,
    badgeBg: "bg-[#047857] text-white",
    icon: Shield,
  },
  {
    rank: 4,
    name: "Sahakar Bharati College",
    state: "Bengaluru, Karnataka",
    trainees: "720",
    trainers: 38,
    rating: 4.5,
    badgeBg: "bg-[#D97706] text-white",
    icon: School,
  },
  {
    rank: 5,
    name: "Gujarat Cooperative College",
    state: "Ahmedabad, Gujarat",
    trainees: "650",
    trainers: 36,
    rating: 4.4,
    badgeBg: "bg-[#2563EB] text-white",
    icon: Building2,
  },
];

export function TopInstitutionsCard() {
  return (
    <div className="flex flex-col justify-between h-full rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900 dark:text-foreground">
          <Landmark className="size-4.5 text-[#E30B1C]" />
          <span>Top Institutions</span>
        </h2>
        <Link
          href="/admin/institutions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#E30B1C] hover:underline"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="w-full my-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-border/70 text-slate-400 font-semibold text-[11px]">
              <th className="py-2 pr-1 font-medium w-4">#</th>
              <th className="py-2 pr-2 font-medium">Institution</th>
              <th className="py-2 pr-2 font-medium">State</th>
              <th className="py-2 px-1 font-medium text-right">Trainees</th>
              <th className="py-2 px-1 font-medium text-right">Trainers</th>
              <th className="py-2 pl-1 font-medium text-right">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-border/50">
            {INSTITUTIONS.map((inst) => {
              const Icon = inst.icon;
              return (
                <tr key={inst.rank} className="hover:bg-slate-50/60 dark:hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pr-1 text-slate-400 font-medium text-[11px]">{inst.rank}</td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`flex size-5.5 shrink-0 items-center justify-center rounded-full ${inst.badgeBg} shadow-2xs`}
                      >
                        <Icon className="size-3" />
                      </span>
                      <span className="font-heading font-semibold text-slate-900 dark:text-foreground truncate text-xs">
                        {inst.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2 text-slate-500 dark:text-muted-foreground truncate text-[11px] max-w-[120px]">
                    {inst.state}
                  </td>
                  <td className="py-2.5 px-1 text-right font-medium text-slate-900 dark:text-foreground text-[11px]">
                    {inst.trainees}
                  </td>
                  <td className="py-2.5 px-1 text-right text-slate-500 dark:text-muted-foreground text-[11px]">
                    {inst.trainers}
                  </td>
                  <td className="py-2.5 pl-1 text-right">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-foreground text-[11px]">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      <span>{inst.rating.toFixed(1)}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
