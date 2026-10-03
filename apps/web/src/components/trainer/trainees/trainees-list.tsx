"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState, ErrorState } from "@/components/trainer/states";
import { useTrainerQuery } from "@/lib/trainer/api";
import { cn } from "@/lib/utils";
import { InitialsAvatar, PctCell, StatusBadge, relTime, type TraineeRow } from "./shared";

interface TraineesData {
  trainees: TraineeRow[];
  total: number;
  batches: { id: string; name: string }[];
  status_counts: Record<string, number>;
}

const STATUSES = [
  { key: "on_track", label: "On Track", dot: "bg-success" },
  { key: "needs_attention", label: "Needs Attention", dot: "bg-warning" },
  { key: "at_risk", label: "At Risk", dot: "bg-destructive" },
  { key: "completed", label: "Completed", dot: "bg-blue-600" },
];
const BANDS: Record<string, [number, number]> = { high: [75, 101], mid: [50, 75], low: [0, 50] };
const PAGE_SIZE = 15;

const selectCls =
  "h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function TraineesList() {
  const sp = useSearchParams();
  const q = useTrainerQuery<TraineesData>("/trainees");
  const [batch, setBatch] = useState(sp.get("batch") ?? "all");
  const [status, setStatus] = useState(sp.get("status") ?? "all");
  const [search, setSearch] = useState("");
  const [att, setAtt] = useState("all");
  const [perf, setPerf] = useState("all");
  const [page, setPage] = useState(1);

  const all = useMemo(() => q.data?.trainees ?? [], [q.data]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter((t) => {
      if (batch !== "all" && t.batch_id !== batch && t.batch !== batch) return false;
      if (status !== "all" && t.status !== status) return false;
      if (term && !t.name.toLowerCase().includes(term) && !t.trainee_code.toLowerCase().includes(term)) return false;
      if (att !== "all" && !(t.attendance >= BANDS[att][0] && t.attendance < BANDS[att][1])) return false;
      if (perf !== "all" && !(t.assessment >= BANDS[perf][0] && t.assessment < BANDS[perf][1])) return false;
      return true;
    });
  }, [all, batch, status, search, att, perf]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const rows = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const dirty = batch !== "all" || status !== "all" || search || att !== "all" || perf !== "all";
  const upd = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };
  function reset() {
    setBatch("all"); setStatus("all"); setSearch(""); setAtt("all"); setPerf("all"); setPage(1);
  }

  const th = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Trainees" description="Track attendance, learning progress and skill readiness across all your batches." />

      {/* status summary (clickable filters) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {q.loading && !q.data
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
          : STATUSES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => upd(setStatus)(status === s.key ? "all" : s.key)}
                aria-pressed={status === s.key}
                className={cn("flex flex-col items-start gap-1 rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40", status === s.key ? "border-primary ring-2 ring-primary/20" : "border-border/60")}
              >
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><span className={cn("size-2 rounded-full", s.dot)} />{s.label}</span>
                <span className="font-heading text-2xl font-bold">{q.data?.status_counts?.[s.key] ?? 0}</span>
              </button>
            ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search trainees" placeholder="Search by name or trainee code" value={search} onChange={(e) => upd(setSearch)(e.target.value)} className="h-10 pl-9" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
          <select aria-label="Batch" className={selectCls} value={batch} onChange={(e) => upd(setBatch)(e.target.value)}>
            <option value="all">All batches</option>
            {(q.data?.batches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select aria-label="Status" className={selectCls} value={status} onChange={(e) => upd(setStatus)(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select aria-label="Attendance band" className={selectCls} value={att} onChange={(e) => upd(setAtt)(e.target.value)}>
            <option value="all">Any attendance</option>
            <option value="high">75%+ attendance</option>
            <option value="mid">50–74% attendance</option>
            <option value="low">Below 50%</option>
          </select>
          <select aria-label="Performance band" className={selectCls} value={perf} onChange={(e) => upd(setPerf)(e.target.value)}>
            <option value="all">Any performance</option>
            <option value="high">75%+ assessment</option>
            <option value="mid">50–74% assessment</option>
            <option value="low">Below 50%</option>
          </select>
        </div>
        {dirty && <Button variant="ghost" onClick={reset}><X className="size-4" /> Clear</Button>}
      </div>

      {q.loading && !q.data ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : q.error && !q.data ? (
        <ErrorState message={q.error} onRetry={q.refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState title={all.length === 0 ? "No trainees assigned yet." : "No trainees match these filters."} hint={dirty ? "Try clearing a filter." : undefined} />
      ) : (
        <>
          {/* desktop / tablet table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm md:block">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr><th className={th}>Trainee</th><th className={th}>Batch</th><th className={th}>Attendance</th><th className={th}>Learning</th><th className={th}>Assessment</th><th className={th}>Skill readiness</th><th className={th}>Status</th><th className={th} /></tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5">
                      <Link href={`/trainer/trainees/${t.id}`} className="flex items-center gap-3">
                        <InitialsAvatar name={t.name} />
                        <span><span className="block font-medium text-foreground">{t.name}</span><span className="block text-xs text-muted-foreground">{t.trainee_code}</span></span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{t.batch}</td>
                    <td className="px-3 py-2.5"><PctCell value={t.attendance} /></td>
                    <td className="px-3 py-2.5"><PctCell value={t.learning} /></td>
                    <td className="px-3 py-2.5"><PctCell value={t.assessment} /></td>
                    <td className="px-3 py-2.5"><PctCell value={t.skill_readiness} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={t.status} label={t.status_label} /></td>
                    <td className="px-3 py-2.5 text-right"><Link href={`/trainer/trainees/${t.id}`} className={buttonVariants({ variant: "outline", size: "xs" })}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((t) => (
              <li key={t.id}>
                <Link href={`/trainer/trainees/${t.id}`} className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={t.name} />
                    <div className="min-w-0 flex-1"><p className="truncate font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.trainee_code} · {t.batch}</p></div>
                    <StatusBadge status={t.status} label={t.status_label} />
                  </div>
                  <dl className="grid grid-cols-4 gap-2 text-center text-xs">
                    {[["Attend.", t.attendance], ["Learning", t.learning], ["Assess.", t.assessment], ["Skills", t.skill_readiness]].map(([l, v]) => (
                      <div key={l as string} className="rounded-lg bg-muted/50 py-1.5"><dt className="text-muted-foreground">{l}</dt><dd className="text-sm"><PctCell value={v as number} /></dd></div>
                    ))}
                  </dl>
                  <p className="text-xs text-muted-foreground">Last active {relTime(t.last_activity)}</p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>Showing {(cur - 1) * PAGE_SIZE + 1}–{Math.min(cur * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)}><ChevronLeft className="size-4" /> Prev</Button>
              <span className="tabular-nums">{cur} / {pages}</span>
              <Button variant="outline" size="sm" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Next <ChevronRight className="size-4" /></Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
