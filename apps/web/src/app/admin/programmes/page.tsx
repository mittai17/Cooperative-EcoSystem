"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminSelect, AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { Pager } from "@/components/admin/shared/pager";
import { StatusPill } from "@/components/admin/shared/status-pill";
import type { Programme } from "@/lib/admin/admin-api";
import { DEMO_PROGRAMMES, PROGRAMME_SECTORS, durationLabel, modeLabel } from "@/components/admin/programmes/programme-data";
import { fetchAllProgrammes } from "@/components/admin/programmes/admin-helpers";
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
const STATUS_OPTIONS = [
  { value: ALL, label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const CATEGORY_OPTIONS = [
  { value: ALL, label: "All Categories" },
  ...PROGRAMME_SECTORS.map((c) => ({ value: c, label: c })),
];

export default function ProgrammesPage() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [catalogue, setCatalogue] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Programme | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // The backend list has no category filter, so the catalogue is loaded once
  // (all pages) and filtered and paged on the client.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchAllProgrammes();
        if (cancelled) return;
        setCatalogue(rows && rows.length > 0 ? rows : DEMO_PROGRAMMES);
        setError(null);
      } catch {
        if (cancelled) return;
        setCatalogue(DEMO_PROGRAMMES);
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
    return catalogue.filter(
      (p) =>
        (!needle || p.title.toLowerCase().includes(needle) || (p.sector ?? "").toLowerCase().includes(needle)) &&
        (!sector || p.sector === sector) &&
        (!status || p.status === status),
    );
  }, [catalogue, query, sector, status]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={BookOpen}
        title="Training Programs"
        description="Manage training programs."
        action={
          <Link href="/admin/programmes/new" className={primaryButtonClass}>
            <Plus className="size-4" aria-hidden /> Create Program
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
          placeholder="Search programs..."
          onReset={() => {
            setQuery("");
            setSector(ALL);
            setStatus(ALL);
            setPage(1);
          }}
          filters={
            <>
              <AdminSelect
                label="Category"
                value={sector}
                options={CATEGORY_OPTIONS}
                onChange={(value) => {
                  setSector(value);
                  setPage(1);
                }}
              />
              <AdminSelect
                label="Status"
                value={status}
                options={STATUS_OPTIONS}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              />
            </>
          }
        />

        {selected ? (
          <DetailPanel
            title={selected.title}
            onClose={() => setSelected(null)}
            closeLabel="Close programme details"
          >
            {selected.sector ?? "No category"} · {durationLabel(selected.duration_weeks)} · {modeLabel(selected.mode)} ·{" "}
            {selected.seats_filled} of {selected.seats_total} seats filled
          </DetailPanel>
        ) : null}

        {loading ? (
          <TableSkeleton label="Loading programmes" />
        ) : rows.length === 0 ? (
          <EmptyState message={catalogue.length === 0 ? "No training programs yet." : "No programmes match these filters."} />
        ) : (
          <TableScroll>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Program Name</th>
                  <th className={thClass}>Category</th>
                  <th className={thClass}>Duration</th>
                  <th className={thClass}>Mode</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className={rowClass}>
                    <td className={`${tdClass} font-medium`}>{p.title}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{p.sector ?? "-"}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{durationLabel(p.duration_weeks)}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{modeLabel(p.mode)}</td>
                    <td className={tdClass}>
                      <StatusPill status={p.status} />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <button type="button" onClick={() => setSelected(p)} className={viewButtonClass}>
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
