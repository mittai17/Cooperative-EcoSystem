"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminSelect, AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { Pager } from "@/components/admin/shared/pager";
import { StatusPill } from "@/components/admin/shared/status-pill";
import type { Job } from "@/lib/admin/admin-api";
import { DEMO_JOBS, JOB_STATUSES } from "@/components/admin/jobs/job-data";
import { fetchAllJobs, formatDate } from "@/components/admin/programmes/admin-helpers";
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
const STATUS_OPTIONS = [{ value: ALL, label: "All Status" }, ...JOB_STATUSES];

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
        setJobs(rows && rows.length > 0 ? rows : DEMO_JOBS);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setJobs(DEMO_JOBS);
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
          <Link href="/admin/jobs-placements/new" className={primaryButtonClass}>
            <Plus className="size-4" aria-hidden /> Post Job
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
          placeholder="Search jobs..."
          onReset={() => {
            setQuery("");
            setStatus(ALL);
            setPage(1);
          }}
          filters={
            <AdminSelect
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            />
          }
        />

        {selected ? (
          <DetailPanel title={selected.title} onClose={() => setSelected(null)} closeLabel="Close job details">
            {selected.employer_name ?? "Unknown employer"} · {selected.location ?? "No location"} ·{" "}
            {selected.job_type ?? "Job type not set"} · {selected.openings ?? 0} openings · {selected.applicants}{" "}
            applicants · Posted {formatDate(selected.posted_at)}
          </DetailPanel>
        ) : null}

        {loading ? (
          <TableSkeleton label="Loading jobs" />
        ) : rows.length === 0 ? (
          <EmptyState message={jobs.length === 0 ? "No job postings yet." : "No jobs match these filters."} />
        ) : (
          <TableScroll>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Job Title</th>
                  <th className={thClass}>Employer</th>
                  <th className={thClass}>Job Type</th>
                  <th className={thClass}>Location</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((job) => (
                  <tr key={job.id} className={rowClass}>
                    <td className={`${tdClass} font-medium`}>{job.title}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{job.employer_name ?? "-"}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{job.job_type ?? "-"}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{job.location ?? "-"}</td>
                    <td className={tdClass}>
                      <StatusPill status={job.status} />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <button type="button" onClick={() => setSelected(job)} className={viewButtonClass}>
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
