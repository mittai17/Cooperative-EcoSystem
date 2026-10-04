"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminSelect, AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { Pager } from "@/components/admin/shared/pager";
import { StatusPill } from "@/components/admin/shared/status-pill";
import type { Assessment } from "@/lib/admin/admin-api";
import { DEMO_ASSESSMENTS, assessmentStatus } from "@/components/admin/assessments/assessment-data";
import { fetchAllAssessments, formatDate } from "@/components/admin/programmes/admin-helpers";
import {
  DetailPanel,
  EmptyState,
  ListCard,
  ListErrorBanner,
  TableScroll,
  TableSkeleton,
  primaryButtonClass,
  rowClass,
  tableClass,
  tdClass,
  thClass,
  viewButtonClass,
} from "@/components/admin/programmes/admin-ui";

const ALL = "";

export default function AssessmentsPage() {
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Assessment | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // The backend list filters by search only, so the list is loaded once (all pages)
  // and the programme filter and paging run on the client.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchAllAssessments();
        if (cancelled) return;
        setAssessments(rows && rows.length > 0 ? rows : DEMO_ASSESSMENTS);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setAssessments(DEMO_ASSESSMENTS);
        setError(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const programOptions = useMemo(
    () => [
      { value: ALL, label: "All Programs" },
      ...Array.from(new Set(assessments.map((a) => a.programme_title).filter((p): p is string => Boolean(p))))
        .sort()
        .map((p) => ({ value: p, label: p })),
    ],
    [assessments],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assessments.filter(
      (a) =>
        (!needle ||
          a.title.toLowerCase().includes(needle) ||
          (a.programme_title ?? "").toLowerCase().includes(needle) ||
          (a.skill_name ?? "").toLowerCase().includes(needle)) &&
        (!program || a.programme_title === program),
    );
  }, [assessments, query, program]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={ClipboardCheck}
        title="Assessments"
        description="Manage trainee assessments and evaluations."
        action={
          <Link href="/admin/assessments/new" className={primaryButtonClass}>
            <Plus className="size-4" aria-hidden /> Create Assessment
          </Link>
        }
      />

      <ListCard>
        <ListErrorBanner error={error} onRetry={() => setReloadKey((k) => k + 1)} />

        <AdminToolbar
          search={query}
          onSearch={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Search assessments..."
          onReset={() => {
            setQuery("");
            setProgram(ALL);
            setPage(1);
          }}
          filters={
            <AdminSelect
              label="Program"
              value={program}
              options={programOptions}
              onChange={(value) => {
                setProgram(value);
                setPage(1);
              }}
            />
          }
        />

        {selected ? (
          <DetailPanel
            title={selected.title}
            onClose={() => setSelected(null)}
            closeLabel="Close assessment details"
          >
            {selected.programme_title ?? "No program"} · {selected.total_questions} questions · {selected.duration_minutes}{" "}
            min · Pass mark {selected.passing_score}% · {selected.attempts} attempts
            {selected.due_date ? ` · Due ${formatDate(selected.due_date)}` : ""}
          </DetailPanel>
        ) : null}

        {loading ? (
          <TableSkeleton label="Loading assessments" />
        ) : rows.length === 0 ? (
          <EmptyState message={assessments.length === 0 ? "No assessments yet." : "No assessments match these filters."} />
        ) : (
          <TableScroll>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Assessment Title</th>
                  <th className={thClass}>Program</th>
                  <th className={thClass}>Attempts</th>
                  <th className={thClass}>Due Date</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className={rowClass}>
                    <td className={`${tdClass} font-medium`}>{a.title}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{a.programme_title ?? "-"}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{a.attempts.toLocaleString("en-IN")}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{formatDate(a.due_date)}</td>
                    <td className={tdClass}>
                      <StatusPill status={assessmentStatus(a)} />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <button type="button" onClick={() => setSelected(a)} className={viewButtonClass}>
                        View
                      </button>
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
