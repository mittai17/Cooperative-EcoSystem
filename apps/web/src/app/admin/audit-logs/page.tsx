"use client";

import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { Pager } from "@/components/admin/shared/pager";
import { listAuditLogs, type AuditLog } from "@/lib/admin/admin-api";
import { DEMO_AUDIT_LOGS } from "@/components/admin/audit/audit-data";
import { formatDate } from "@/components/admin/programmes/admin-helpers";

function formatWhen(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : `${formatDate(value)} ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}`;
}

export default function AuditLogsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [rows, setRows] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listAuditLogs({ q: query || undefined, page, page_size: pageSize });
        if (cancelled) return;
        setRows(res.items);
        setTotal(res.total);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const needle = query.trim().toLowerCase();
        const filtered = DEMO_AUDIT_LOGS.filter(
          (e) =>
            !needle ||
            (e.actor_name ?? "").toLowerCase().includes(needle) ||
            e.action.toLowerCase().includes(needle) ||
            e.entity.toLowerCase().includes(needle),
        );
        setRows(filtered.slice((page - 1) * pageSize, page * pageSize));
        setTotal(filtered.length);
        setError(err instanceof Error ? err.message : "Failed to load audit logs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, page, pageSize, reloadKey]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={ScrollText}
        title="Audit Logs"
        description="Review who changed what, and when, across the admin portal."
      />

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
          onSearch={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Search by actor, action or entity..."
          onReset={() => {
            setQuery("");
            setPage(1);
          }}
          filters={null}
        />

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading audit logs">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              No audit entries match this search.
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">When</th>
                  <th className="px-3 py-3 font-semibold">Actor</th>
                  <th className="px-3 py-3 font-semibold">Action</th>
                  <th className="px-3 py-3 font-semibold">Entity</th>
                  <th className="px-3 py-3 font-semibold">Entity ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-3 whitespace-nowrap text-slate-600">{formatWhen(entry.created_at)}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">{entry.actor_name ?? "System"}</td>
                    <td className="px-3 py-3">
                      <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{entry.action}</code>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{entry.entity}</td>
                    <td className="px-3 py-3 text-slate-600">{entry.entity_id ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-5">
          <Pager
            page={page}
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
