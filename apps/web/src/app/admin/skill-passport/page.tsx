"use client";

import { useEffect, useMemo, useState } from "react";
import { IdCard } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import type { SkillPassportRow } from "@/lib/admin/admin-api";
import { DEMO_SKILL_PASSPORT } from "@/components/admin/skill-passport/skill-passport-data";
import { fetchAllSkillPassport } from "@/components/admin/programmes/admin-helpers";

export default function SkillPassportPage() {
  const [rows, setRows] = useState<SkillPassportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAllSkillPassport();
        if (cancelled) return;
        setRows(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setRows(DEMO_SKILL_PASSPORT);
        setError(err instanceof Error ? err.message : "Failed to load skill passport");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? rows.filter((r) => r.skill.toLowerCase().includes(needle)) : rows;
  }, [rows, query]);

  const totalVerified = rows.reduce((sum, r) => sum + r.verified_count, 0);
  const rated = rows.filter((r) => r.avg_proficiency !== null);
  const avgProficiency =
    rated.length === 0 ? null : rated.reduce((sum, r) => sum + (r.avg_proficiency ?? 0), 0) / rated.length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={IdCard}
        title="Skill Passport"
        description="Aggregate of verified skills held by trainees across all programmes."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard icon={IdCard} tone="red" value={rows.length} label="Skills tracked" />
        <KpiCard
          icon={IdCard}
          tone="green"
          value={totalVerified.toLocaleString("en-IN")}
          label="Verified skill records"
        />
        <KpiCard
          icon={IdCard}
          tone="blue"
          value={avgProficiency === null ? "-" : avgProficiency.toFixed(1)}
          label="Average proficiency (out of 5)"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {error && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <DemoBanner />
            <span className="text-xs text-slate-500">Live data unavailable: {error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        <AdminToolbar
          search={query}
          onSearch={setQuery}
          placeholder="Search skills..."
          onReset={() => setQuery("")}
          filters={null}
        />

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading skill passport">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              No verified skills found.
            </div>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">#</th>
                  <th className="px-3 py-3 font-semibold">Skill</th>
                  <th className="px-3 py-3 font-semibold">Verified Count</th>
                  <th className="px-3 py-3 font-semibold">Avg Proficiency</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr key={row.skill} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">{row.skill}</td>
                    <td className="px-3 py-3 text-slate-600">{row.verified_count.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {row.avg_proficiency === null ? "-" : `${row.avg_proficiency.toFixed(1)} / 5`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
