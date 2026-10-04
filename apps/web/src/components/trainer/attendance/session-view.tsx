"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCheck, Loader2, Radio, Save, Search, Sparkles, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { cn } from "@/lib/utils";
import { trainerPost, useTrainerQuery } from "@/lib/trainer/api";
import { Avatar } from "./session-table";
import { STATUS_LABEL, STATUS_STYLE, type AttStatus, type SessionState } from "./types";

const ORDER: AttStatus[] = ["present", "absent", "late", "excused"];
const ACTIVE: Record<AttStatus, string> = {
  present: "bg-success text-white",
  absent: "bg-destructive text-white",
  late: "bg-amber-500 text-white",
  excused: "bg-blue-500 text-white",
};

function useCountdown(closesAt: string | undefined, live: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);
  if (!closesAt || !live) return 0;
  return Math.max(0, Math.floor((new Date(closesAt).getTime() - now) / 1000));
}
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// ── QR visual generator (deterministic SVG) ──────
const QR_MODULES = 25;

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function finderOrigin(row: number, col: number): { row: number; col: number } | null {
  const last = QR_MODULES - 7;
  if (row < 7 && col < 7) return { row: 0, col: 0 };
  if (row < 7 && col >= last) return { row: 0, col: last };
  if (row >= last && col < 7) return { row: last, col: 0 };
  return null;
}

function finderBit(row: number, col: number, origin: { row: number; col: number }): boolean {
  const r = row - origin.row;
  const c = col - origin.col;
  const ring = r === 0 || c === 0 || r === 6 || c === 6;
  const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
  return ring || core;
}

function buildQrPath(payload: string): string {
  const random = mulberry32(fnv1a(payload));
  const grid: boolean[][] = [];
  for (let row = 0; row < QR_MODULES; row += 1) {
    const cells: boolean[] = [];
    for (let col = 0; col < QR_MODULES; col += 1) {
      const origin = finderOrigin(row, col);
      if (origin) {
        cells.push(finderBit(row, col, origin));
      } else if (row === 6 || col === 6) {
        cells.push((row === 6 ? col : row) % 2 === 0);
      } else {
        cells.push(random() > 0.52);
      }
    }
    grid.push(cells);
  }
  let path = "";
  for (let row = 0; row < QR_MODULES; row += 1) {
    for (let col = 0; col < QR_MODULES; col += 1) {
      if (grid[row][col]) path += `M${col},${row}h1v1h-1z`;
    }
  }
  return path;
}
// ──────────────────────────────────────────────────

export function SessionView({ id, mode }: { id: string; mode: string }) {
  const q = useTrainerQuery<SessionState>(`/attendance/session/${id}`, { pollMs: 3000 });
  const d = q.data;
  const live = d?.status === "live";
  const left = useCountdown(d?.closes_at, live);
  const [edits, setEdits] = useState<Record<string, AttStatus>>({});
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<"save" | "end" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const rows = useMemo(
    () => (d?.roster ?? []).map((r) => ({ ...r, shown: edits[r.trainee_id] ?? r.status })),
    [d?.roster, edits]
  );
  const visible = rows.filter((r) => !search.trim() || `${r.name} ${r.code}`.toLowerCase().includes(search.trim().toLowerCase()));
  const pending = Object.entries(edits).filter(([tid, st]) => d?.roster.find((r) => r.trainee_id === tid)?.status !== st);
  const tally = ORDER.map((s) => [s, rows.filter((r) => r.shown === s).length] as const);

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: ok });
      q.refetch();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };
  const save = () =>
    run(
      "save",
      async () => {
        await trainerPost("/attendance/mark", {
          session_id: id,
          records: pending.map(([trainee_id, status]) => ({ trainee_id, status })),
        });
        setEdits({});
      },
      "Attendance saved"
    );

  if (q.loading && !d) return <LoadingBlock rows={6} />;
  if (q.error && !d) return <ErrorState message={q.error} onRetry={q.refetch} />;
  if (!d) return null;

  const showQr = mode !== "manual" && d.qr;
  const pct = d.roster_size ? Math.round((100 * d.present) / d.roster_size) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/trainer/attendance" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Attendance
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight">{d.course}</h1>
            {live ? (
              <Badge className="gap-1 bg-success/10 text-success"><Radio className="size-3 animate-pulse" /> Live</Badge>
            ) : (
              <Badge variant="secondary">Closed</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {d.batch}
            {d.room ? ` · ${d.room}` : ""} · {new Date(d.opens_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} –{" "}
            {new Date(d.closes_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {live && (
          <Button variant="outline" onClick={() => setConfirm("end")}>
            <Square className="size-4" /> End session
          </Button>
        )}
      </div>

      {msg && (
        <p role="status" className={cn("rounded-xl px-4 py-2 text-sm", msg.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
          {msg.text}
        </p>
      )}

      <div className={cn("grid gap-5", showQr && "lg:grid-cols-[minmax(0,380px)_1fr]")}>
        {showQr && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="rounded-2xl border bg-white p-4">
              <svg viewBox={`0 0 ${QR_MODULES} ${QR_MODULES}`} width={240} height={240} className="fill-current text-slate-900">
                <path d={buildQrPath(d.qr as string)} />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-heading text-4xl font-bold tabular-nums">{mmss(left)}</p>
              <p className="text-xs text-muted-foreground">until attendance closes · QR refreshes every 30s</p>
            </div>
            <Button
              variant="secondary"
              disabled={busy === "sim"}
              onClick={() => run("sim", () => trainerPost(`/attendance/session/${id}/simulate-checkin`), "Simulated one trainee check-in (demo)")}
            >
              {busy === "sim" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Simulate check-in
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">Demo helper: marks the next trainee present without a phone.</p>
          </div>
        )}

        <div className="space-y-5">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="font-heading text-3xl font-bold tabular-nums">
                  {d.present} <span className="text-lg font-medium text-muted-foreground">/ {d.roster_size}</span>
                </p>
              </div>
              <p className="text-sm font-semibold">{pct}%</p>
            </div>
            <Progress value={pct} className="mt-3" />
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Live check-ins</h2>
            {d.recent.length === 0 ? (
              <EmptyState title="No check-ins yet" hint={live ? "Trainees appear here as they scan." : "Nobody checked in."} />
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto">
                {d.recent.map((r) => (
                  <li key={r.trainee_id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{r.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {r.time} · {r.method}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Roster</h2>
            <p className="text-xs text-muted-foreground">{tally.map(([s, n]) => `${n} ${STATUS_LABEL[s].toLowerCase()}`).join(" · ")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input aria-label="Search trainees" placeholder="Search trainee" className="w-full pl-9 sm:w-56" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setEdits(Object.fromEntries(rows.map((r) => [r.trainee_id, "present" as AttStatus])))}>
              <CheckCheck className="size-4" /> Mark all present
            </Button>
            <Button disabled={pending.length === 0} onClick={() => setConfirm("save")}>
              <Save className="size-4" /> Save{pending.length ? ` (${pending.length})` : ""}
            </Button>
          </div>
        </div>
        {visible.length === 0 ? (
          <div className="p-4"><EmptyState title="No trainees found" /></div>
        ) : (
          <ul className="divide-y">
            {visible.map((r) => (
              <li key={r.trainee_id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar initials={r.initials} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.code}
                      {r.marked && r.time && !edits[r.trainee_id] ? ` · ${r.method} ${r.time}` : ""}
                    </p>
                  </div>
                </div>
                <div role="radiogroup" aria-label={`Status for ${r.name}`} className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1 sm:w-72">
                  {ORDER.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={r.shown === s}
                      onClick={() => setEdits((e) => ({ ...e, [r.trainee_id]: s }))}
                      className={cn(
                        "rounded-lg px-1 py-1.5 text-xs font-medium transition-colors",
                        r.shown === s ? ACTIVE[s] : "text-muted-foreground hover:bg-card"
                      )}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={confirm === "save"} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save attendance?</DialogTitle>
            <DialogDescription>
              {pending.length} change{pending.length === 1 ? "" : "s"} will be recorded as manual overrides by you.{" "}
              {ORDER.map((s) => [s, pending.filter(([, st]) => st === s).length] as const)
                .filter(([, n]) => n)
                .map(([s, n]) => (
                  <span key={s} className={cn("mr-1 inline-block rounded-full px-2 py-0.5 text-xs", STATUS_STYLE[s])}>{n} {STATUS_LABEL[s]}</span>
                ))}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button onClick={save} disabled={busy === "save"}>
              {busy === "save" && <Loader2 className="size-4 animate-spin" />} Confirm &amp; save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirm === "end"} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End this session?</DialogTitle>
            <DialogDescription>Trainees will no longer be able to scan in. You can still edit the roster afterwards.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Keep open</Button>
            <Button onClick={() => run("end", () => trainerPost(`/attendance/session/${id}/close`), "Session ended")} disabled={busy === "end"}>
              {busy === "end" && <Loader2 className="size-4 animate-spin" />} End session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
