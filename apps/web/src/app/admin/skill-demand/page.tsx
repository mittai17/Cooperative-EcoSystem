"use client";

import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Sparkles, TrendingUp, Layers } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import { adminSkillDemand } from "@/lib/mock-data/dashboards";

const EMERGING_SKILLS = [
  { skill: "Digital Payments", growth: "+45%", action: "Increase Capacity" },
  { skill: "Drone Operations", growth: "+82%", action: "Launch New Program" },
  { skill: "Supply Chain Analytics", growth: "+30%", action: "Update Curriculum" },
];

const INSTITUTION_COVERAGE = [
  { institution: "Institute of Rural Management, Anand", state: "Gujarat", skills: "Dairy Ops, Management", capacity: "High" },
  { institution: "VAMNICOM", state: "Maharashtra", skills: "Credit Appraisal, Banking", capacity: "Medium" },
];

export default function SkillDemandPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Sparkles}
        title="AI Analytics"
        description="Monitor employer skill requirements versus current training supply."
      />

      <DemoBanner />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard icon={Layers} tone="red" value={adminSkillDemand.length} label="Skills tracked" />
        <KpiCard icon={TrendingUp} tone="green" value="+82%" label="Fastest growing skill" delta="Drone Operations" deltaTone="up" />
        <KpiCard icon={Sparkles} tone="blue" value={INSTITUTION_COVERAGE.length} label="Institutions reporting coverage" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Top Demanded Skills vs Supply</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminSkillDemand} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="skill" type="category" axisLine={false} tickLine={false} width={100} />
                <Tooltip cursor={{ fill: "#F8FAFC" }} contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Bar dataKey="demand" fill="#E31B23" radius={[0, 6, 6, 0]} name="Demand Index" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Emerging Skills</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5 font-semibold">Skill</th>
                <th className="px-3 py-2.5 font-semibold">Growth (MoM)</th>
                <th className="px-3 py-2.5 font-semibold">Action Recommended</th>
              </tr>
            </thead>
            <tbody>
              {EMERGING_SKILLS.map((row) => (
                <tr key={row.skill} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{row.skill}</td>
                  <td className="px-3 py-2.5 font-semibold text-emerald-600">{row.growth}</td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {row.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Institution-wise Skill Coverage</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5 font-semibold">Institution</th>
                <th className="px-3 py-2.5 font-semibold">State</th>
                <th className="px-3 py-2.5 font-semibold">Top Skills Taught</th>
                <th className="px-3 py-2.5 font-semibold">Capacity</th>
              </tr>
            </thead>
            <tbody>
              {INSTITUTION_COVERAGE.map((row) => (
                <tr key={row.institution} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{row.institution}</td>
                  <td className="px-3 py-2.5 text-slate-600">{row.state}</td>
                  <td className="px-3 py-2.5 text-slate-600">{row.skills}</td>
                  <td className="px-3 py-2.5 text-slate-600">{row.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
