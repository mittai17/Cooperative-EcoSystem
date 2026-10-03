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
    <div className="flex flex-col justify-between h-full rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900 dark:text-foreground">
          <Briefcase className="size-4.5 text-[#E30B1C]" />
          <span>Placement Overview</span>
        </h2>
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white dark:bg-card px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-foreground hover:bg-slate-50 cursor-pointer"
          >
            <span>{period}</span>
            <ChevronDown className="size-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-2 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-xs bg-[#E30B1C]" />
          <span>Job Placements</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center justify-center size-2.5 text-[#F87171]">◆</span>
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
              fill="#E30B1C"
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
              isAnimationActive={false}
            />
            <Line
              yAxisId="rate"
              dataKey="rate"
              name="Placement Rate"
              type="monotone"
              stroke="#F87171"
              strokeWidth={2}
              dot={{ r: 3, fill: "#F87171" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
