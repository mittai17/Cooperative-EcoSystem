"use client";

import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { Pager } from "@/components/admin/shared/pager";
import { listAuditLogs, type AuditLog } from "@/lib/admin/admin-api";
import { DEMO_AUDIT_LOGS } from "@/components/admin/audit/audit-data";
import { formatDate } from "@/components/admin/programmes/admin-helpers";
import {
  EmptyState,
  InitialsAvatar,
  ListCard,
  ListErrorBanner,
  TableScroll,
  TableSkeleton,
  rowClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/programmes/admin-ui";

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

      <ListCard>
        <ListErrorBanner error={error} onRetry={() => setReloadKey((k) => k + 1)} />

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
        />

        {loading ? (
          <TableSkeleton label="Loading audit logs" />
        ) : rows.length === 0 ? (
          <EmptyState message="No audit entries match this search." />
        ) : (
          <TableScroll>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>When</th>
                  <th className={thClass}>Actor</th>
                  <th className={thClass}>Action</th>
                  <th className={thClass}>Entity</th>
                  <th className={thClass}>Entity ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.id} className={rowClass}>
                    <td className={`${tdClass} whitespace-nowrap text-muted-foreground`}>
                      {formatWhen(entry.created_at)}
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={entry.actor_name ?? "System"} />
                        <span className="font-medium">{entry.actor_name ?? "System"}</span>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <code className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground">{entry.action}</code>
                    </td>
                    <td className={`${tdClass} text-muted-foreground`}>{entry.entity}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{entry.entity_id ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}

        <div className="px-1">
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
      </ListCard>
    </div>
  );
}
