"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, Download, MoreVertical, PauseCircle, Plus, Clock3, Eye, Pencil } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminSelect, AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import { Pager } from "@/components/admin/shared/pager";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { formatCount } from "@/components/admin/dashboard/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listInstitutions, type Institution, type InstitutionStatus } from "@/lib/admin/admin-api";
import { cn } from "@/lib/utils";

import { DEMO_INSTITUTIONS, DEMO_INSTITUTION_STATS, INDIAN_STATES, INSTITUTION_TYPE_OPTIONS } from "./constants";
import { InstitutionLogo } from "./institution-logo";
import { InstitutionProfilePanel } from "./institution-detail-panel";
import { normaliseInstitutionStatus } from "./institution-status";

/** Under review is not a backend state, so its tab never sends a request. */
type StatusTab = "all" | InstitutionStatus | "under_review";

const TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All Institutions" },
  { key: "active", label: "Active" },
  { key: "under_review", label: "Under Review" },
  { key: "inactive", label: "Inactive" },
];

interface Counts {
  total: number;
  active: number;
  /** Always null: the platform does not track an under-review state. */
  under_review: null;
  inactive: number;
}

const PAGE_SIZE_DEFAULT = 10;

function matchesDemo(row: Institution, q: string, state: string, type: string, status: string): boolean {
  const needle = q.trim().toLowerCase();
  if (needle && ![row.name, row.state ?? "", row.district ?? "", row.type].some((v) => v.toLowerCase().includes(needle))) return false;
  if (state && row.state !== state) return false;
  if (type && row.type !== type) return false;
  if (status && normaliseInstitutionStatus(row.status) !== status) return false;
  return true;
}

function downloadCsv(rows: Institution[]) {
  const header = ["Institution", "State", "District", "Type", "Trainers", "Trainees", "Status"];
  const escape = (value: string | number | null) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((row) =>
    [row.name, row.state, row.district, row.type, row.trainers, row.trainees, row.status].map(escape).join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "institutions.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function InstitutionsListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [state, setState] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState<"" | InstitutionStatus>("");
  const [tab, setTab] = useState<StatusTab>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const [result, setResult] = useState<{ key: string; items: Institution[]; total: number } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const notTracked = tab === "under_review";
  const trackedStatus: "" | InstitutionStatus = tab === "all" ? status : notTracked ? "" : tab;
  const requestKey = JSON.stringify([debouncedSearch, state, type, trackedStatus, page, pageSize, notTracked]);
  const loading = !notTracked && result?.key !== requestKey && failedKey !== requestKey;
  const rows = !notTracked && result?.key === requestKey ? result.items : [];
  const total = !notTracked && result?.key === requestKey ? result.total : 0;
  const error = !notTracked && failedKey === requestKey;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Counts for KPI cards and tabs come from paged totals, so each uses page_size=1.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listInstitutions({ page_size: 1 }),
      listInstitutions({ status: "active", page_size: 1 }),
      listInstitutions({ status: "inactive", page_size: 1 }),
    ])
      .then(([all, active, inactive]) => {
        if (cancelled) return;
        setCounts({ total: all.total, active: active.total, under_review: null, inactive: inactive.total });
      })
      .catch(() => {
        if (!cancelled) setCounts(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (notTracked) return;
    let cancelled = false;
    listInstitutions({
      q: debouncedSearch,
      state,
      type,
      status: trackedStatus || undefined,
      page,
      page_size: pageSize,
    })
      .then((response) => {
        if (!cancelled) setResult({ key: requestKey, items: response.items, total: response.total });
      })
      .catch(() => {
        if (!cancelled) setFailedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
    // requestKey encodes every query input, so it is the single dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  // Demo fallback: filter and paginate the fictional rows locally.
  const demoFiltered = useMemo(
    () => DEMO_INSTITUTIONS.filter((row) => matchesDemo(row, debouncedSearch, state, type, trackedStatus)),
    [debouncedSearch, state, type, trackedStatus],
  );
  const demoPage = demoFiltered.slice((page - 1) * pageSize, page * pageSize);

  const usingDemo = error;
  const visibleRows = usingDemo ? demoPage : rows;
  const visibleTotal = usingDemo ? demoFiltered.length : total;
  const pageCount = Math.max(1, Math.ceil(visibleTotal / pageSize));

  const kpiCounts: Counts = usingDemo || !counts ? DEMO_INSTITUTION_STATS : counts;
  const kpiLive = !usingDemo && counts !== null;

  const selected = visibleRows.find((row) => row.id === selectedId) ?? visibleRows[0] ?? null;

  const resetFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setState("");
    setType("");
    setStatus("");
    setTab("all");
    setPage(1);
  }, []);

  const tabCount = (key: StatusTab): number | null => {
    if (key === "under_review") return null;
    const source = usingDemo ? DEMO_INSTITUTION_STATS : counts;
    if (!source) return null;
    return key === "all" ? source.total : source[key];
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Building2}
        title="Institutions"
        description="Manage all registered training institutions across the cooperative training network."
        action={
          <Link
            href="/admin/institutions/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            <Plus className="size-4" aria-hidden />
            Add Institution
          </Link>
        }
      />

      {usingDemo ? <DemoBanner message="The institutions service is unavailable. Showing fictional sample records." /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Building2} tone="red" value={formatCount(kpiCounts.total)} label="Total Institutions" />
        <KpiCard icon={CheckCircle2} tone="green" value={formatCount(kpiCounts.active)} label="Active Institutions" />
        <KpiCard
          icon={Clock3}
          tone="amber"
          value={kpiCounts.under_review === null ? "Not tracked" : formatCount(kpiCounts.under_review)}
          label="Under Review"
        />
        <KpiCard icon={PauseCircle} tone="red" value={formatCount(kpiCounts.inactive)} label="Inactive" />
      </div>
      {!kpiLive && !usingDemo && counts === null && !loading ? (
        <p className="text-xs text-muted-foreground">Status totals are unavailable right now.</p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-2 sm:px-4">
            <div role="tablist" aria-label="Filter by status" className="flex overflow-x-auto">
              {TABS.map((item) => {
                const count = tabCount(item.key);
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setTab(item.key);
                      setPage(1);
                    }}
                    className={cn(
                      "-mb-px whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-medium",
                      active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                    {item.key === "under_review" ? " (not tracked)" : count !== null ? ` (${formatCount(count)})` : ""}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => downloadCsv(visibleRows)}
              disabled={visibleRows.length === 0}
              className="my-2 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              <Download className="size-4" aria-hidden />
              Export
            </button>
          </div>

          <AdminToolbar
            search={search}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search institutions by name, state or type…"
            onReset={resetFilters}
            filters={
              <>
                <AdminSelect
                  label="State"
                  value={state}
                  onChange={(value) => {
                    setState(value);
                    setPage(1);
                  }}
                  options={[{ value: "", label: "All States" }, ...INDIAN_STATES.map((s) => ({ value: s, label: s }))]}
                />
                <AdminSelect
                  label="Type"
                  value={type}
                  onChange={(value) => {
                    setType(value);
                    setPage(1);
                  }}
                  options={[{ value: "", label: "All Types" }, ...INSTITUTION_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))]}
                />
                <AdminSelect
                  label="Status"
                  value={tab === "all" ? status : notTracked ? "" : tab}
                  onChange={(value) => {
                    setTab("all");
                    setStatus(value as "" | InstitutionStatus);
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </>
            }
          />

          <div className="overflow-x-auto border-t border-border">
            {loading && !usingDemo ? (
              <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Loading institutions">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-lg bg-muted/70" />
                ))}
              </div>
            ) : notTracked ? (
              <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
                <Clock3 className="size-8 text-muted-foreground" aria-hidden />
                <p className="font-medium text-foreground">Under review is not tracked yet</p>
                <p className="text-sm text-muted-foreground">Institutions are currently recorded only as active or inactive.</p>
              </div>
            ) : visibleRows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
                <Building2 className="size-8 text-muted-foreground" aria-hidden />
                <p className="font-medium text-foreground">No institutions match these filters</p>
                <p className="text-sm text-muted-foreground">Try clearing the search or choosing another status.</p>
                <button type="button" onClick={resetFilters} className="mt-2 text-sm font-medium text-primary hover:underline">
                  Reset filters
                </button>
              </div>
            ) : (
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-3 py-3 font-medium">Institution Name</th>
                    <th className="px-3 py-3 font-medium">State</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 text-right font-medium">Trainers</th>
                    <th className="px-3 py-3 text-right font-medium">Trainees</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, index) => {
                    const isSelected = selected?.id === row.id;
                    const detailHref = `/admin/institutions/${encodeURIComponent(row.id)}`;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        aria-selected={isSelected}
                        className={cn("cursor-pointer border-t border-border hover:bg-muted/50", isSelected && "bg-tint-red-bg/40")}
                      >
                        <td className="px-4 py-3 text-muted-foreground">{(page - 1) * pageSize + index + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <InstitutionLogo name={row.name} />
                            <span className="font-medium text-foreground">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{[row.district, row.state].filter(Boolean).join(", ") || "—"}</td>
                        <td className="px-3 py-3 text-muted-foreground capitalize">{row.type}</td>
                        <td className="px-3 py-3 text-right">{formatCount(row.trainers)}</td>
                        <td className="px-3 py-3 text-right">{formatCount(row.trainees)}</td>
                        <td className="px-3 py-3">
                          <StatusPill status={normaliseInstitutionStatus(row.status)} />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1.5" onClick={(event) => event.stopPropagation()}>
                            <Link
                              href={detailHref}
                              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
                            >
                              <Eye className="size-3.5" aria-hidden />
                              View
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <button
                                    type="button"
                                    className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
                                    aria-label={`More actions for ${row.name}`}
                                  >
                                    <MoreVertical className="size-4" aria-hidden />
                                  </button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuLabel>{row.name}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push(detailHref)}>
                                  <Eye className="mr-2 size-3.5" aria-hidden />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`${detailHref}/edit`)}>
                                  <Pencil className="mr-2 size-3.5" aria-hidden />
                                  Edit institution
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="border-t border-border">
            <Pager
              page={page}
              pageCount={pageCount}
              total={visibleTotal}
              pageSize={pageSize}
              onPage={(next) => setPage(Math.min(Math.max(1, next), pageCount))}
              onPageSize={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        </section>

        {selected ? (
          <InstitutionProfilePanel institution={selected} />
        ) : (
          <div className="hidden rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground xl:block">
            Select an institution to see its profile.
          </div>
        )}
      </div>
    </div>
  );
}
