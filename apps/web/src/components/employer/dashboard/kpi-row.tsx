import { Briefcase, FileText, Gift, ListChecks, Trophy, Video, type LucideIcon } from "lucide-react";
import { StatCard, type StatTint } from "@/components/dashboard/stat-card";
import type { EmployerDashboard, KpiValue } from "@/lib/employer/jobs-api";
import { SectionError, SectionSkeleton } from "./section-shell";

type KpiKey = keyof EmployerDashboard["kpis"];

const KPI_META: { key: KpiKey; label: string; icon: LucideIcon; tint: StatTint }[] = [
  { key: "active_jobs", label: "Active Jobs", icon: Briefcase, tint: "red" },
  { key: "applications", label: "Total Applications", icon: FileText, tint: "red" },
  { key: "shortlisted", label: "Shortlisted", icon: ListChecks, tint: "amber" },
  { key: "interviews", label: "Interviews", icon: Video, tint: "blue" },
  { key: "offers", label: "Offers", icon: Gift, tint: "green" },
  { key: "hired", label: "Hired", icon: Trophy, tint: "amber" },
];

export function trendText(kpi?: KpiValue): { text: string; tone: "up" | "down" | "neutral" } {
  if (!kpi) return { text: "No change", tone: "neutral" };
  if (kpi.delta > 0) return { text: `+${kpi.delta} ${kpi.period || ""}`, tone: "up" };
  if (kpi.delta < 0) return { text: `${kpi.delta} ${kpi.period || ""}`, tone: "down" };
  return { text: `No change ${kpi.period || ""}`, tone: "neutral" };
}

export function KpiRow({
  kpis,
  loading,
  error,
}: {
  kpis: EmployerDashboard["kpis"] | null;
  loading: boolean;
  error: boolean;
}) {
  if (error) return <SectionError />;
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6" aria-busy="true">
        {KPI_META.map((meta, index) => (
          <div key={meta.key} className="rounded-2xl border border-border/60 bg-card p-5" data-index={index}>
            <SectionSkeleton rows={2} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {KPI_META.map((meta) => {
        const kpi = kpis?.[meta.key];
        const trend = trendText(kpi);
        return (
          <StatCard
            key={meta.key}
            label={meta.label}
            value={kpi ? String(kpi.value) : "0"}
            icon={meta.icon}
            tint={meta.tint}
            trend={trend.text}
            trendTone={trend.tone}
          />
        );
      })}
    </div>
  );
}
