"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DONUT_COLORS, type ChartPoint } from "@/components/admin/reports/report-data";

export function EnrollmentBarChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
        <Tooltip cursor={{ fill: "#F8FAFC" }} contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
        <Bar dataKey="value" name="Count" fill="#E31B23" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DistributionDonut({ data }: { data: ChartPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative h-48 w-48 shrink-0 self-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="100%" stroke="none">
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{total.toLocaleString("en-IN")}</span>
          <span className="text-xs text-slate-500">Total</span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-2 text-sm">
        {data.map((entry, index) => (
          <li key={entry.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-700">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
              />
              {entry.label}
            </span>
            <span className="font-semibold text-slate-900">
              {total === 0 ? 0 : Math.round((entry.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
