"use client";

import { useState } from "react";
import { TrendingUp, ChevronDown } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTHLY_DATA = [
  { month: "Jan", new_enrollments: 720, certifications: 310 },
  { month: "Feb", new_enrollments: 980, certifications: 420 },
  { month: "Mar", new_enrollments: 1010, certifications: 430 },
  { month: "Apr", new_enrollments: 1100, certifications: 510 },
  { month: "May", new_enrollments: 1210, certifications: 540 },
  { month: "Jun", new_enrollments: 1290, certifications: 600 },
  { month: "Jul", new_enrollments: 1360, certifications: 640 },
  { month: "Aug", new_enrollments: 1470, certifications: 750 },
  { month: "Sep", new_enrollments: 1620, certifications: 980 },
  { month: "Oct", new_enrollments: 1880, certifications: 1210 },
];

export function EnrollmentTrendCard() {
  const [period, setPeriod] = useState("Last 6 months");

  return (
    <div className="flex flex-col justify-between h-full rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900 dark:text-foreground">
          <TrendingUp className="size-4.5 text-[#E30B1C]" />
          <span>Trainee Enrollment Trend</span>
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
      <div className="flex items-center gap-4 mb-2 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-xs bg-[#E30B1C]" />
          <span>New Enrollments</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-xs bg-[#FECDD3]" />
          <span>Certifications</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MONTHLY_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={3}>
            <CartesianGrid vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke="#94A3B8"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke="#94A3B8"
              domain={[0, 2000]}
              ticks={[0, 500, 1000, 1500, 2000]}
            />
            <Tooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
              formatter={(value) => Number(value).toLocaleString("en-IN")}
            />
            <Bar
              dataKey="new_enrollments"
              name="New Enrollments"
              fill="#E30B1C"
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
              isAnimationActive={false}
            />
            <Bar
              dataKey="certifications"
              name="Certifications"
              fill="#FECDD3"
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
