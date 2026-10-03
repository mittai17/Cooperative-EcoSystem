"use client";

import { useState } from "react";
import { PieChart as PieIcon, ChevronDown } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const PROGRAM_DATA = [
  { label: "Dairy & Livestock", percent: 32, color: "#DC2626" },
  { label: "Cooperative Management", percent: 24, color: "#F87171" },
  { label: "Agri Business", percent: 18, color: "#F59E0B" },
  { label: "Rural Development", percent: 12, color: "#06B6D4" },
  { label: "Digital Skills", percent: 8, color: "#3B82F6" },
  { label: "Others", percent: 6, color: "#94A3B8" },
];

export function ProgramDistributionCard() {
  const [filter, setFilter] = useState("All Programs");

  return (
    <div className="flex flex-col justify-between h-full rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900 dark:text-foreground">
          <PieIcon className="size-4.5 text-[#E30B1C]" />
          <span>Program Distribution</span>
        </h2>
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white dark:bg-card px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-foreground hover:bg-slate-50 cursor-pointer"
          >
            <span>{filter}</span>
            <ChevronDown className="size-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Content: Donut Chart + Legend */}
      <div className="flex flex-col sm:flex-row items-center gap-4 py-2 my-auto">
        {/* Donut Chart */}
        <div className="relative size-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PROGRAM_DATA}
                dataKey="percent"
                nameKey="label"
                innerRadius="68%"
                outerRadius="98%"
                stroke="none"
                paddingAngle={2}
                isAnimationActive={false}
              >
                {PROGRAM_DATA.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-xl font-bold text-slate-900 dark:text-foreground">12,460</span>
            <span className="text-xs text-slate-500 font-medium">Trainees</span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full min-w-0 flex-1 space-y-2">
          {PROGRAM_DATA.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-slate-800 dark:text-foreground font-medium">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate">{entry.label}</span>
              </span>
              <span className="font-semibold text-slate-500 shrink-0">{entry.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
