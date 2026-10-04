"use client";

import { Briefcase } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PlacementOverviewPoint } from "@/lib/admin/admin-api";
import { DashboardPanel, EmptyState } from "./panel";

export function PlacementOverviewCard({ points }: { points: PlacementOverviewPoint[] }) {
  return (
    <DashboardPanel
      icon={Briefcase}
      title="Placement Overview"
      action={points.length > 0 ? <span className="text-xs font-medium text-muted-foreground">Last {points.length} months</span> : null}
      className="h-full"
    >
      {points.length === 0 ? (
        <EmptyState message="No placement data yet." />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-5 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-primary" aria-hidden />
              Job Placements
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-[#1E293B]" aria-hidden />
              Placement Rate
            </span>
          </div>
          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="#94A3B8" />
                <YAxis yAxisId="count" tickLine={false} axisLine={false} fontSize={11} stroke="#94A3B8" />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="#94A3B8"
                />
                <Tooltip formatter={(value, name) => [name === "Placement Rate" ? `${value}%` : value, name]} />
                <Bar yAxisId="count" dataKey="placements" name="Job Placements" fill="#E31B23" radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Line yAxisId="rate" dataKey="rate" name="Placement Rate" type="monotone" stroke="#1E293B" strokeWidth={2} dot={{ r: 2.5, fill: "#1E293B" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </DashboardPanel>
  );
}
