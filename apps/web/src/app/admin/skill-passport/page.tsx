"use client";

import { useEffect, useMemo, useState } from "react";
import { IdCard } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import { Pager } from "@/components/admin/shared/pager";
import type { SkillPassportRow } from "@/lib/admin/admin-api";
import { DEMO_SKILL_PASSPORT } from "@/components/admin/skill-passport/skill-passport-data";
import { fetchAllSkillPassport } from "@/components/admin/programmes/admin-helpers";
import {
  EmptyState,
  ListCard,
  ListErrorBanner,
  TableScroll,
  TableSkeleton,
  rowClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/programmes/admin-ui";

export default function SkillPassportPage() {
  const [rows, setRows] = useState<SkillPassportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAllSkillPassport();
        if (cancelled) return;
        setRows(data && data.length > 0 ? data : DEMO_SKILL_PASSPORT);
        setError(null);
      } catch {
        if (cancelled) return;
        setRows(DEMO_SKILL_PASSPORT);
        setError(null);
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

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

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

      <ListCard>
        <ListErrorBanner error={error} onRetry={() => setReloadKey((k) => k + 1)} />

        <AdminToolbar
          search={query}
          onSearch={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Search skills..."
          onReset={() => {
            setQuery("");
            setPage(1);
          }}
        />

        {loading ? (
          <TableSkeleton label="Loading skill passport" />
        ) : visible.length === 0 ? (
          <EmptyState message={rows.length === 0 ? "No verified skills yet." : "No skills match this search."} />
        ) : (
          <TableScroll>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Skill</th>
                  <th className={thClass}>Verified Count</th>
                  <th className={thClass}>Avg Proficiency</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.skill_id} className={rowClass}>
                    <td className={`${tdClass} font-medium`}>{row.skill}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{row.verified_count.toLocaleString("en-IN")}</td>
                    <td className={`${tdClass} text-muted-foreground`}>
                      {row.avg_proficiency === null ? "-" : `${row.avg_proficiency.toFixed(1)} / 5`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}

        <div className="px-1">
          <Pager
            page={safePage}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </ListCard>
    </div>
  );
}
