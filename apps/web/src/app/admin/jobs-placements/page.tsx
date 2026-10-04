"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, Eye, Plus, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { Pager } from "@/components/admin/shared/pager";
import { StatusPill } from "@/components/admin/shared/status-pill";
import type { Job } from "@/lib/admin/admin-api";
import { DEMO_JOBS, JOB_STATUSES } from "@/components/admin/jobs/job-data";
import { fetchAllJobs } from "@/components/admin/programmes/admin-helpers";
import { formatDate } from "@/components/admin/programmes/admin-helpers";

const ALL = "";
const selectClass =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary";

export default function JobsPlacementsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Job | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // The job list is loaded once (all pages) and filtered and paged on the client.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchAllJobs();
        if (cancelled) return;
        setJobs(rows);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setJobs(DEMO_JOBS);
        setError(err instanceof Error ? err.message : "Failed to load jobs");
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
    return jobs.filter(
      (j) =>
        (!needle ||
          j.title.toLowerCase().includes(needle) ||
          (j.employer_name ?? "").toLowerCase().includes(needle) ||
          (j.location ?? "").toLowerCase().includes(needle)) &&
        (!status || j.status === status),
    );
  }, [jobs, query, status]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Briefcase}
        title="Jobs & Placements"
        description="Manage job postings and placement activities."
        action={
          <Link
            href="/admin/jobs-placements/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" /> Post Job
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
          placeholder="Search jobs..."
          onReset={() => {
            setQuery("");
            setStatus(ALL);
            setPage(1);
          }}
          filters={
            <select
              aria-label="Status"
              className={selectClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value={ALL}>All Status</option>
              {JOB_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
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
                {selected.employer_name ?? "Unknown employer"} · {selected.location ?? "No location"} ·{" "}
                {selected.job_type ?? "Job type not set"} · {selected.openings ?? 0} openings · {selected.applicants}{" "}
                applicants · Posted {formatDate(selected.posted_at)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900"
              aria-label="Close job details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="overflow-x-auto px-5 pb-2">
          {loading ? (
            <div className="space-y-3 py-3" aria-busy="true" aria-label="Loading jobs">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="my-4 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              {jobs.length === 0 ? "No job postings yet." : "No jobs match these filters."}
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">Job Title</th>
                  <th className="px-3 py-3 font-semibold">Employer</th>
                  <th className="px-3 py-3 font-semibold">Job Type</th>
                  <th className="px-3 py-3 font-semibold">Location</th>
                  <th className="px-3 py-3 font-semibold">Applicants</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((job) => (
                  <tr key={job.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{job.title}</td>
                    <td className="px-3 py-3 text-slate-600">{job.employer_name ?? "-"}</td>
                    <td className="px-3 py-3 text-slate-600">{job.job_type ?? "-"}</td>
                    <td className="px-3 py-3 text-slate-600">{job.location ?? "-"}</td>
                    <td className="px-3 py-3 text-slate-600">{job.applicants}</td>
                    <td className="px-3 py-3">
                      <StatusPill status={job.status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(job)}
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
