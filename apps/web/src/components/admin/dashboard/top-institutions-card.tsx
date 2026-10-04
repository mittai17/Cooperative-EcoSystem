"use client";

import { Landmark, Star } from "lucide-react";
import type { TopInstitution } from "@/lib/admin/admin-api";
import { InstitutionLogo } from "@/components/admin/institutions/institution-logo";
import { formatCount } from "./format";
import { DashboardPanel, EmptyState } from "./panel";

export function TopInstitutionsCard({ rows }: { rows: TopInstitution[] }) {
  return (
    <DashboardPanel icon={Landmark} title="Top Institutions" viewAllHref="/admin/institutions" className="h-full">
      {rows.length === 0 ? (
        <EmptyState message="No institutions ranked yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-xs">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground">
                <th className="pb-2.5 font-medium">#</th>
                <th className="pb-2.5 font-medium">Institution</th>
                <th className="pb-2.5 font-medium">State</th>
                <th className="pb-2.5 text-right font-medium">Trainers</th>
                <th className="pb-2.5 text-right font-medium">Trainees</th>
                <th className="pb-2.5 text-right font-medium">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((row, index) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/40">
                  <td className="py-2.5 font-medium text-muted-foreground">{index + 1}</td>
                  <td className="py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <InstitutionLogo name={row.name} className="size-7 text-[10px]" />
                      <span className="truncate font-semibold text-foreground">{row.name}</span>
                    </div>
                  </td>
                  <td className="max-w-[9rem] truncate py-2.5 text-muted-foreground">{row.state ?? "—"}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{formatCount(row.trainers)}</td>
                  <td className="py-2.5 text-right font-medium text-foreground">{formatCount(row.trainees)}</td>
                  <td className="py-2.5 text-right">
                    {typeof row.rating !== "number" || !Number.isFinite(row.rating) ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                        <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                        {row.rating.toFixed(1)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardPanel>
  );
}
