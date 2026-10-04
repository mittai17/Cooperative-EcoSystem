"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Brain, ChevronRight, ClipboardList, GraduationCap, Landmark, Lightbulb, Plus, Sparkles, Users } from "lucide-react";
import { AdminBetaBadge, AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import { InstitutionLogo } from "@/components/admin/institutions/institution-logo";
import { adminSkillDemand } from "@/lib/mock-data/dashboards";
import { cn } from "@/lib/utils";

/*
 * Every figure on this page is a fictional sample. No analytics endpoint is
 * connected yet, so the DemoBanner stays visible for the whole page.
 */

const KPI_SAMPLES = [
  {
    label: "Skill Demand Growth",
    value: "+42%",
    delta: "+18% vs last 6 months",
    icon: Users,
    tone: "red" as const,
    trend: [18, 22, 21, 27, 30, 29, 35, 42],
  },
  {
    label: "Placement Probability",
    value: "68%",
    delta: "+12% vs last 6 months",
    icon: ClipboardList,
    tone: "blue" as const,
    trend: [52, 55, 54, 58, 61, 60, 65, 68],
  },
  {
    label: "Skill Gap",
    value: "24%",
    delta: "-8% vs last 6 months",
    icon: GraduationCap,
    tone: "green" as const,
    trend: [36, 34, 35, 31, 30, 29, 27, 24],
  },
  {
    label: "Institutions Coverage",
    value: "85%",
    delta: "+15% vs last 6 months",
    icon: Landmark,
    tone: "violet" as const,
    trend: [62, 66, 68, 71, 74, 78, 80, 85],
  },
];

const SKILL_GAP = [
  { skill: "Dairy Operations", demand: 1240, supply: 680 },
  { skill: "Digital Marketing", demand: 980, supply: 540 },
  { skill: "Bookkeeping", demand: 860, supply: 620 },
  { skill: "Food Safety", demand: 540, supply: 420 },
  { skill: "Supply Chain", demand: 650, supply: 380 },
];

const EMERGING_SKILLS = [
  { skill: "Drone Operations", growth: "+120%", confidence: "High", level: 0.8 },
  { skill: "Agri Business", growth: "+85%", confidence: "High", level: 0.6 },
  { skill: "Renewable Energy", growth: "+62%", confidence: "Medium", level: 0.45 },
  { skill: "Cold Chain Management", growth: "+48%", confidence: "Medium", level: 0.4 },
  { skill: "Cooperative Finance", growth: "+36%", confidence: "High", level: 0.65 },
];

const INSTITUTION_COVERAGE = [
  { institution: "VAMNICOM", state: "Maharashtra", skillsTaught: 12, demandMatch: 92 },
  { institution: "Amul Dairy Training Centre", state: "Gujarat", skillsTaught: 10, demandMatch: 86 },
  { institution: "NCDC Training Institute", state: "Delhi", skillsTaught: 8, demandMatch: 78 },
  { institution: "Sahakar Bharati College", state: "Karnataka", skillsTaught: 9, demandMatch: 74 },
  { institution: "Gujarat Cooperative College", state: "Gujarat", skillsTaught: 8, demandMatch: 70 },
];

const RECOMMENDATIONS = [
  {
    title: "Start a new program on Drone Operations",
    detail: "High demand in Agriculture sector (+120%)",
    href: "/admin/programmes",
    tile: "bg-rose-50 border-rose-200/70",
    icon: Lightbulb,
    iconTone: "bg-tint-red-bg text-tint-red-fg",
  },
  {
    title: "Increase training capacity for Digital Marketing",
    detail: "Supply gap of 440 trainees",
    href: "/admin/trainees",
    tile: "bg-blue-50 border-blue-200/70",
    icon: Users,
    iconTone: "bg-tint-blue-bg text-tint-blue-fg",
  },
  {
    title: "Update Food Safety curriculum",
    detail: "Align with latest industry standards",
    href: "/admin/programmes",
    tile: "bg-emerald-50 border-emerald-200/70",
    icon: ClipboardList,
    iconTone: "bg-tint-green-bg text-tint-green-fg",
  },
];

const PILL_ACTION =
  "inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-xs font-semibold transition-colors";

function TopSkillBars() {
  const ranked = [...adminSkillDemand].sort((a, b) => b.demand - a.demand);
  const max = Math.max(...ranked.map((row) => row.demand), 1);
  return (
    <ul className="flex flex-col gap-3">
      {ranked.map((row, index) => (
        <li key={row.skill} className="flex items-center gap-3 text-sm">
          <span className="w-36 shrink-0 truncate text-foreground">{row.skill}</span>
          <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-slate-100">
            <div
              className="absolute inset-y-0 left-0 rounded-md"
              style={{
                width: `${(row.demand / max) * 100}%`,
                backgroundColor: `rgba(227, 27, 35, ${Math.max(0.35, 1 - index * 0.14)})`,
              }}
              aria-hidden
            />
          </div>
          <span className="w-10 shrink-0 text-right font-semibold text-foreground">{row.demand}</span>
        </li>
      ))}
    </ul>
  );
}

function GapPill({ value }: { value: number }) {
  return (
    <span className="inline-flex rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

export default function SkillDemandPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Brain}
        title="AI Analytics"
        badge={<AdminBetaBadge label="Beta" />}
        description="AI-powered insights to optimize training programs, skill development and employment outcomes."
      />

      <DemoBanner message="Analytics figures are fictional samples. The analytics service is not connected yet." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_SAMPLES.map((kpi) => (
          <KpiCard
            key={kpi.label}
            icon={kpi.icon}
            tone={kpi.tone}
            value={kpi.value}
            label={kpi.label}
            delta={kpi.delta}
            deltaTone={kpi.label === "Skill Gap" ? "flat" : "up"}
            sparkline={kpi.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
          <header className="mb-5 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
              <Sparkles className="size-4.5 text-primary" aria-hidden />
              Top In-Demand Skills
            </h2>
          </header>
          <TopSkillBars />
        </section>

        <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
          <header className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
              <Sparkles className="size-4.5 text-primary" aria-hidden />
              Skill Demand vs Available Supply
            </h2>
          </header>
          <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-primary" aria-hidden />
              Demand (Employers)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-[#FCA5A5]" aria-hidden />
              Available Supply (Trained)
            </span>
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SKILL_GAP} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="skill" tickLine={false} axisLine={false} fontSize={11} stroke="#94A3B8" interval={0} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#94A3B8" />
                <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.04)" }} />
                <Bar dataKey="demand" name="Demand (Employers)" fill="#E31B23" radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Bar dataKey="supply" name="Available Supply (Trained)" fill="#FCA5A5" radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">Skill Gap Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-2.5 pr-3 font-medium">Skill</th>
                  <th className="py-2.5 pr-3 font-medium">Demand</th>
                  <th className="py-2.5 pr-3 font-medium">Supply</th>
                  <th className="py-2.5 pr-3 font-medium">Gap</th>
                  <th className="py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {SKILL_GAP.map((row) => (
                  <tr key={row.skill} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{row.skill}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{row.demand.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{row.supply.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 pr-3">
                      <GapPill value={row.supply - row.demand} />
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href="/admin/programmes"
                        className={cn(PILL_ACTION, "border-rose-200 bg-rose-50 text-primary hover:bg-rose-100")}
                      >
                        Suggest Program
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
            <Sparkles className="size-4.5 text-violet-600" aria-hidden />
            Emerging Skills (AI Prediction)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-2.5 pr-3 font-medium">Skill</th>
                  <th className="py-2.5 pr-3 font-medium">Growth (6M)</th>
                  <th className="py-2.5 pr-3 font-medium">Confidence</th>
                  <th className="py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {EMERGING_SKILLS.map((row) => (
                  <tr key={row.skill} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{row.skill}</td>
                    <td className="py-2.5 pr-3 font-semibold text-emerald-600">{row.growth}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                          <div
                            className={cn("h-full rounded-full", row.confidence === "High" ? "bg-emerald-500" : "bg-amber-500")}
                            style={{ width: `${row.level * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{row.confidence}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href="/admin/programmes"
                        className={cn(PILL_ACTION, "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100")}
                      >
                        <Plus className="size-3" aria-hidden />
                        Add to Program
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-7">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
            <Landmark className="size-4.5 text-primary" aria-hidden />
            Institution-wise Skill Coverage
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-2.5 pr-3 font-medium">Institution</th>
                  <th className="py-2.5 pr-3 font-medium">State</th>
                  <th className="py-2.5 pr-3 font-medium">Skills Taught</th>
                  <th className="py-2.5 pr-3 font-medium">Demand Match</th>
                  <th className="py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {INSTITUTION_COVERAGE.map((row) => (
                  <tr key={row.institution} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <InstitutionLogo name={row.institution} className="size-7 text-[10px]" />
                        <span className="truncate font-medium text-foreground">{row.institution}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{row.state}</td>
                    <td className="py-2.5 pr-3 text-foreground">{row.skillsTaught}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.demandMatch}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">{row.demandMatch}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href="/admin/institutions"
                        className="inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-5">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
            <Lightbulb className="size-4.5 text-primary" aria-hidden />
            AI Recommendations
          </h2>
          <ul className="flex flex-col gap-3">
            {RECOMMENDATIONS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:brightness-[0.98]",
                      item.tile,
                    )}
                  >
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", item.iconTone)}>
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{item.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
