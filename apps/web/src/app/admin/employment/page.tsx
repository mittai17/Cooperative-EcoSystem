"use client";

import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from "recharts";
import { Clock, TrendingUp, Users, Target } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import { adminEmploymentFunnel, adminMonthlyOutcomes } from "@/lib/mock-data/dashboards";

const TOP_EMPLOYERS = [
  { name: "Amul Dairy", hires: 340 },
  { name: "IFFCO", hires: 210 },
  { name: "NCDC", hires: 150 },
];

const STATE_PLACEMENTS = [
  { state: "Gujarat", placements: "1,240" },
  { state: "Maharashtra", placements: "980" },
  { state: "Uttar Pradesh", placements: "850" },
];

export default function EmploymentPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={TrendingUp}
        title="Employment Outcomes"
        description="Track placement rates and employment metrics across all institutions."
      />

      <DemoBanner />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard icon={Clock} tone="red" value="45 Days" label="Avg Time-to-Placement" delta="-5 days vs last year" deltaTone="up" />
        <KpiCard icon={Users} tone="green" value="7,380" label="Total Employed" delta="+12% this quarter" deltaTone="up" />
        <KpiCard icon={Target} tone="blue" value="75.7%" label="Placement Rate" delta="+2.1% vs last cohort" deltaTone="up" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Training to Employment Funnel</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminEmploymentFunnel} layout="vertical" margin={{ left: 100, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} width={100} />
                <Tooltip cursor={{ fill: "#F8FAFC" }} contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Bar dataKey="count" fill="#E31B23" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Monthly Employed vs Certified</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adminMonthlyOutcomes} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Line type="monotone" dataKey="certified" stroke="#1E293B" strokeWidth={2} />
                <Line type="monotone" dataKey="employed" stroke="#E31B23" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Top Hiring Employers</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5 font-semibold">Employer</th>
                <th className="px-3 py-2.5 font-semibold">Hires</th>
              </tr>
            </thead>
            <tbody>
              {TOP_EMPLOYERS.map((e) => (
                <tr key={e.name} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{e.name}</td>
                  <td className="px-3 py-2.5 text-slate-600">{e.hires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">State-wise Placements</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5 font-semibold">State</th>
                <th className="px-3 py-2.5 font-semibold">Placements</th>
              </tr>
            </thead>
            <tbody>
              {STATE_PLACEMENTS.map((s) => (
                <tr key={s.state} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{s.state}</td>
                  <td className="px-3 py-2.5 text-slate-600">{s.placements}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
