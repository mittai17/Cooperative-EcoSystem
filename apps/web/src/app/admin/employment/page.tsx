"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";
import { Clock, Target, TrendingUp, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import { adminEmploymentFunnel, adminMonthlyOutcomes } from "@/lib/mock-data/dashboards";

/* Sample rows. The page has no analytics endpoint yet, so DemoBanner stays visible. */
const TOP_EMPLOYERS = [
  { name: "Amul Dairy", hires: 340 },
  { name: "IFFCO", hires: 210 },
  { name: "NCDC", hires: 150 },
];

const STATE_PLACEMENTS = [
  { state: "Gujarat", placements: 1240 },
  { state: "Maharashtra", placements: 980 },
  { state: "Uttar Pradesh", placements: 850 },
];

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 font-heading text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default function EmploymentPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={TrendingUp}
        title="Employment Outcomes"
        description="Track placement rates and employment metrics across all institutions."
      />

      <DemoBanner message="Outcome figures are fictional samples. The analytics service is not connected yet." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard icon={Clock} tone="red" value="45 Days" label="Avg Time-to-Placement" delta="-5 days vs last year" deltaTone="up" />
        <KpiCard icon={Users} tone="green" value="7,380" label="Total Employed" delta="+12% this quarter" deltaTone="up" />
        <KpiCard icon={Target} tone="blue" value="75.7%" label="Placement Rate" delta="+2.1% vs last cohort" deltaTone="up" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Training to Employment Funnel">
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminEmploymentFunnel} layout="vertical" margin={{ left: 16, right: 24 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} width={120} fontSize={12} />
                <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.04)" }} />
                <Bar dataKey="count" name="Learners" fill="#E31B23" radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Monthly Employed vs Certified">
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adminMonthlyOutcomes} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="certified" name="Certified" stroke="#1E293B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="employed" name="Employed" stroke="#E31B23" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Top Hiring Employers">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-2.5 pr-3 font-medium">Employer</th>
                  <th className="py-2.5 text-right font-medium">Hires</th>
                </tr>
              </thead>
              <tbody>
                {TOP_EMPLOYERS.map((employer) => (
                  <tr key={employer.name} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{employer.name}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{employer.hires.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="State-wise Placements">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-2.5 pr-3 font-medium">State</th>
                  <th className="py-2.5 text-right font-medium">Placements</th>
                </tr>
              </thead>
              <tbody>
                {STATE_PLACEMENTS.map((row) => (
                  <tr key={row.state} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{row.state}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{row.placements.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
