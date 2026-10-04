"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Eye, Plus, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { Pager } from "@/components/admin/shared/pager";
import type { Assessment } from "@/lib/admin/admin-api";
import { DEMO_ASSESSMENTS } from "@/components/admin/assessments/assessment-data";
import { fetchAllAssessments, formatDate } from "@/components/admin/programmes/admin-helpers";

const ALL = "";
const selectClass =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary";

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
        setAssessments(rows);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setAssessments(DEMO_ASSESSMENTS);
        setError(err instanceof Error ? err.message : "Failed to load assessments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const programOptions = useMemo(
    () => Array.from(new Set(assessments.map((a) => a.programme_title).filter((p): p is string => Boolean(p)))).sort(),
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
          <Link
            href="/admin/assessments/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" /> Create Assessment
          </Link>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {error && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
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
            <select
              aria-label="Program"
              className={selectClass}
              value={program}
              onChange={(e) => {
                setProgram(e.target.value);
                setPage(1);
              }}
            >
              <option value={ALL}>All Programs</option>
              {programOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          }
        />

        {selected && (
          <div className="mx-5 mb-2 flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-base font-semibold text-slate-900">{selected.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                {selected.programme_title ?? "No program"} · {selected.total_questions} questions ·{" "}
                {selected.duration_minutes} min · Pass mark {selected.passing_score}% · {selected.attempts} attempts
                {selected.due_date ? ` · Due ${formatDate(selected.due_date)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900"
              aria-label="Close assessment details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="overflow-x-auto px-5 pb-2">
          {loading ? (
            <div className="space-y-3 py-3" aria-busy="true" aria-label="Loading assessments">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="my-4 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              {assessments.length === 0 ? "No assessments yet." : "No assessments match these filters."}
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">Assessment Title</th>
                  <th className="px-3 py-3 font-semibold">Program</th>
                  <th className="px-3 py-3 font-semibold">Questions</th>
                  <th className="px-3 py-3 font-semibold">Duration</th>
                  <th className="px-3 py-3 font-semibold">Attempts</th>
                  <th className="px-3 py-3 font-semibold">Due Date</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{a.title}</td>
                    <td className="px-3 py-3 text-slate-600">{a.programme_title ?? "-"}</td>
                    <td className="px-3 py-3 text-slate-600">{a.total_questions}</td>
                    <td className="px-3 py-3 text-slate-600">{a.duration_minutes} min</td>
                    <td className="px-3 py-3 text-slate-600">{a.attempts.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-3 text-slate-600">{formatDate(a.due_date)}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(a)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-5">
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
      </div>
    </div>
  );
}
