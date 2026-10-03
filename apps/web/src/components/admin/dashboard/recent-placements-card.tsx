"use client";

import Link from "next/link";
import { Briefcase, ArrowRight } from "lucide-react";

const PLACEMENTS = [
  {
    candidate: "Kiran Deshmukh",
    role: "Quality Control Executive",
    employer: "Amul Dairy",
    date: "Oct 3, 2026",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=face",
    initials: "KD",
  },
  {
    candidate: "Amit Verma",
    role: "Data Analyst",
    employer: "GCMMF",
    date: "Oct 2, 2026",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
    initials: "AV",
  },
  {
    candidate: "Neha Patel",
    role: "Operations Trainee",
    employer: "Saras Dairy",
    date: "Oct 1, 2026",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face",
    initials: "NP",
  },
  {
    candidate: "Rahul Thakur",
    role: "Supply Chain Executive",
    employer: "IFFCO",
    date: "Sep 30, 2026",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=face",
    initials: "RT",
  },
  {
    candidate: "Meera Singh",
    role: "HR Assistant",
    employer: "NCDC",
    date: "Sep 30, 2026",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
    initials: "MS",
  },
];

export function RecentPlacementsCard() {
  return (
    <div className="flex flex-col justify-between h-full rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900 dark:text-foreground">
          <Briefcase className="size-4.5 text-[#E30B1C]" />
          <span>Recent Job Placements</span>
        </h2>
        <Link
          href="/admin/jobs-placements"
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
              <th className="py-2 pr-2 font-medium">Candidate</th>
              <th className="py-2 pr-2 font-medium">Role</th>
              <th className="py-2 pr-2 font-medium">Employer</th>
              <th className="py-2 pl-1 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-border/50">
            {PLACEMENTS.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-muted/40 transition-colors">
                <td className="py-2.5 pr-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={item.avatar}
                      alt={item.candidate}
                      className="size-6 shrink-0 rounded-full object-cover border border-slate-200"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className="font-heading font-semibold text-slate-900 dark:text-foreground truncate text-xs">
                      {item.candidate}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 pr-2 text-slate-500 dark:text-muted-foreground truncate text-[11px]">{item.role}</td>
                <td className="py-2.5 pr-2 text-slate-900 dark:text-foreground font-medium truncate text-[11px]">{item.employer}</td>
                <td className="py-2.5 pl-1 text-right text-slate-400 dark:text-muted-foreground whitespace-nowrap text-[11px]">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
