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
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
          <Briefcase className="size-4.5 text-red-600" />
          <span>Recent Job Placements</span>
        </h2>
        <Link
          href="/admin/jobs-placements"
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
              <th className="pb-2.5 font-medium">Candidate</th>
              <th className="pb-2.5 font-medium">Role</th>
              <th className="pb-2.5 font-medium">Employer</th>
              <th className="pb-2.5 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {PLACEMENTS.map((item, idx) => (
              <tr key={idx} className="hover:bg-muted/40 transition-colors">
                <td className="py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={item.avatar}
                      alt={item.candidate}
                      className="size-6 shrink-0 rounded-full object-cover border border-border/60"
                      onError={(e) => {
                        // Fallback to text initials if offline
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className="font-heading font-semibold text-foreground truncate">
                      {item.candidate}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-muted-foreground truncate">{item.role}</td>
                <td className="py-2.5 text-foreground font-medium truncate">{item.employer}</td>
                <td className="py-2.5 text-right text-muted-foreground whitespace-nowrap">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
