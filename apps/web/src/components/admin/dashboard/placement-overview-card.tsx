"use client";

import { useState } from "react";
import { Briefcase, ChevronDown } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PLACEMENT_DATA = [
  { month: "Jan", placements: 60, rate: 48 },
  { month: "Feb", placements: 80, rate: 58 },
  { month: "Mar", placements: 92, rate: 62 },
  { month: "Apr", placements: 96, rate: 63 },
  { month: "May", placements: 100, rate: 65 },
  { month: "Jun", placements: 104, rate: 68 },
  { month: "Jul", placements: 110, rate: 70 },
  { month: "Aug", placements: 118, rate: 72 },
  { month: "Sep", placements: 135, rate: 77 },
  { month: "Oct", placements: 158, rate: 83 },
];

export function PlacementOverviewCard() {
  const [period, setPeriod] = useState("Last 6 months");

  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
          <Briefcase className="size-4.5 text-red-600" />
          <span>Placement Overview</span>
        </h2>
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            <span>{period}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-3 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-xs bg-[#DC2626]" />
          <span>Job Placements</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center justify-center size-2.5 text-[#DC2626]">◆</span>
          <span>Placement Rate</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={PLACEMENT_DATA}
            margin={{ top: 8, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke="#94A3B8"
            />
            <YAxis
              yAxisId="count"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke="#94A3B8"
              domain={[0, 200]}
              ticks={[0, 50, 100, 150, 200]}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(value: number) => `${value}%`}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke="#94A3B8"
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <Tooltip
              formatter={(value, name) => [
                name === "Placement Rate" ? `${value}%` : value,
                name,
              ]}
            />
            <Bar
              yAxisId="count"
              dataKey="placements"
              name="Job Placements"
              fill="#DC2626"
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
            />
            <Line
              yAxisId="rate"
              dataKey="rate"
              name="Placement Rate"
              type="monotone"
              stroke="#DC2626"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#DC2626" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
