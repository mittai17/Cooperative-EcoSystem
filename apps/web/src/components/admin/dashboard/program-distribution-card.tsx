"use client";

import { PieChart as PieIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ProgramDistributionPoint } from "@/lib/admin/admin-api";
import { DashboardPanel, EmptyState } from "./panel";
import { formatCount } from "./format";

/** Chart slices in a fixed order. Colours cycle when the API returns more labels than this. */
const SLICE_COLORS = ["#E31B23", "#F26D6F", "#F9A8AB", "#1E293B", "#64748B", "#CBD5E1"];

export function ProgramDistributionCard({ points, trainees }: { points: ProgramDistributionPoint[]; trainees: number }) {
  return (
    <DashboardPanel icon={PieIcon} title="Program Distribution" className="h-full">
      {points.length === 0 ? (
        <EmptyState message="No program distribution data yet." />
      ) : (
        <div className="flex flex-col items-center gap-4 py-2 sm:flex-row">
          <div className="relative size-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={points} dataKey="percent" nameKey="label" innerRadius="68%" outerRadius="98%" stroke="none" paddingAngle={2}>
                  {points.map((entry, index) => (
                    <Cell key={entry.label} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-xl font-bold text-foreground">{formatCount(trainees)}</span>
              <span className="text-xs font-medium text-muted-foreground">Trainees</span>
            </div>
          </div>
          <ul className="w-full min-w-0 flex-1 space-y-2">
            {points.map((entry, index) => (
              <li key={entry.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }} aria-hidden />
                  <span className="truncate">{entry.label}</span>
                </span>
                <span className="shrink-0 font-semibold text-muted-foreground">{entry.percent}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardPanel>
  );
}
