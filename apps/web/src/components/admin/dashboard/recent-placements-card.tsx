"use client";

import { Briefcase } from "lucide-react";
import type { RecentPlacement } from "@/lib/admin/admin-api";
import { formatShortDate, initialsOf } from "./format";
import { DashboardPanel, EmptyState } from "./panel";

export function RecentPlacementsCard({ rows }: { rows: RecentPlacement[] }) {
  return (
    <DashboardPanel icon={Briefcase} title="Recent Job Placements" viewAllHref="/admin/jobs-placements" className="h-full">
      {rows.length === 0 ? (
        <EmptyState message="No placements recorded yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground">
                <th className="pb-2.5 font-medium">Candidate</th>
                <th className="pb-2.5 font-medium">Role</th>
                <th className="pb-2.5 font-medium">Employer</th>
                <th className="pb-2.5 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((row, index) => (
                <tr key={`${row.candidate_name}-${index}`} className="transition-colors hover:bg-muted/40">
                  <td className="py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tint-blue-bg text-[10px] font-bold text-tint-blue-fg"
                      >
                        {initialsOf(row.candidate_name)}
                      </span>
                      <span className="truncate font-semibold text-foreground">{row.candidate_name}</span>
                    </div>
                  </td>
                  <td className="max-w-[8rem] truncate py-2.5 text-muted-foreground">{row.role}</td>
                  <td className="max-w-[7rem] truncate py-2.5 font-medium text-foreground">{row.employer}</td>
                  <td className="py-2.5 text-right whitespace-nowrap text-muted-foreground">{formatShortDate(row.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardPanel>
  );
}
