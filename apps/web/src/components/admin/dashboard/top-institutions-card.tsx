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
    badgeBg: "bg-[#DC2626] text-white",
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
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
          <Landmark className="size-4.5 text-red-600" />
          <span>Top Institutions</span>
        </h2>
        <Link
          href="/admin/institutions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/70 text-muted-foreground font-semibold">
              <th className="pb-2.5 font-medium w-5">#</th>
              <th className="pb-2.5 font-medium">Institution</th>
              <th className="pb-2.5 font-medium">State</th>
              <th className="pb-2.5 font-medium text-right">Trainees</th>
              <th className="pb-2.5 font-medium text-right">Trainers</th>
              <th className="pb-2.5 font-medium text-right">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {INSTITUTIONS.map((inst) => {
              const Icon = inst.icon;
              return (
                <tr key={inst.rank} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 text-muted-foreground font-medium">{inst.rank}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full ${inst.badgeBg} shadow-2xs`}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="font-heading font-semibold text-foreground truncate">
                        {inst.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-muted-foreground truncate">{inst.state}</td>
                  <td className="py-2.5 text-right font-medium text-foreground">{inst.trainees}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{inst.trainers}</td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
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
