"use client";

import { useMemo, useState } from "react";
import { Award, CheckCircle2, ClipboardCheck, Minus, TrendingDown, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trainerPost, useTrainerQuery } from "@/lib/trainer/api";
import { cn } from "@/lib/utils";

interface SkillTrainee {
  trainee_id: string;
  name: string;
  batch: string;
  batch_id: string;
  proficiency: number;
  level: string;
  verified: boolean;
  evidence_count: number;
}
interface SkillRow {
  skill_id: string;
  name: string;
  category: string | null;
  average: number;
  level: string;
  trainee_count: number;
  evidence_count: number;
  below_threshold: number;
  trend: { direction: "up" | "down" | "flat" | null; delta: number | null };
  trainees: SkillTrainee[];
}
interface SkillsResponse {
  batches: { id: string; name: string }[];
  skills: SkillRow[];
  trainee_count: number;
}
interface Dimension {
  key: string;
  label: string;
  hint: string;
}
interface TraineeDetail {
  trainee: { id: string; name: string; batch: string; batch_id: string };
  dimension_averages: Record<string, number>;
  evaluations: { id: string; dimension: string; label: string; rating: number; observation: string | null; date: string | null }[];
}

const selectCls =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

const barColor = (v: number) => (v >= 75 ? "bg-success" : v >= 60 ? "bg-amber-500" : "bg-destructive");

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full", barColor(value))} style={{ width: `${Math.max(2, value)}%` }} />
    </div>
  );
}

function Trend({ t }: { t: SkillRow["trend"] }) {
  if (!t.direction) return <span className="text-xs text-muted-foreground">Trend: not enough evaluations yet</span>;
  const Icon = t.direction === "up" ? TrendingUp : t.direction === "down" ? TrendingDown : Minus;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", t.direction === "up" ? "text-success" : t.direction === "down" ? "text-destructive" : "text-muted-foreground")}>
      <Icon className="size-3.5" /> {t.direction === "flat" ? "Steady" : `${t.delta! > 0 ? "+" : ""}${t.delta} pts vs earlier`}
    </span>
  );
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";

/* ---------------------------- Evaluation dialog --------------------------- */
function EvaluateDialog({
  trainee,
  open,
  onClose,
  onSaved,
}: {
  trainee: { id: string; name: string; batch_id: string; batch: string } | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dims = useTrainerQuery<{ dimensions: Dimension[] }>(open ? "/skills/evaluation-dimensions" : null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const rated = Object.keys(ratings).length;

  async function submit() {
    if (!trainee || rated === 0) return;
    setSaving(true);
    setError(null);
    try {
      await trainerPost("/skills/evaluate", {
        trainee_id: trainee.id,
        batch_id: trainee.batch_id,
        evaluations: Object.entries(ratings).map(([dimension, rating]) => ({
          dimension,
          rating,
          observation: notes[dimension]?.trim() || null,
        })),
      });
      setDone(true);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Evaluate {trainee?.name}</DialogTitle>
          <DialogDescription>
            {trainee?.batch} · Rate the dimensions you observed (1 to 5). Observations are your own notes.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="size-10 text-success" />
            <p className="font-medium">Skill Passport updated</p>
            <p className="text-sm text-muted-foreground">{trainee?.name}&apos;s passport now reflects your evaluation.</p>
            <Button onClick={onClose}>Done</Button>
          </div>
        ) : dims.loading ? (
          <LoadingBlock rows={3} />
        ) : dims.error ? (
          <ErrorState message={dims.error} onRetry={dims.refetch} />
        ) : (
          <>
            <div className="space-y-4">
              {dims.data?.dimensions.map((d) => (
                <div key={d.key} className="rounded-xl border border-border/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{d.label}</p>
                      <p className="text-xs text-muted-foreground">{d.hint}</p>
                    </div>
                    <div className="flex gap-1" role="radiogroup" aria-label={`${d.label} rating`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={ratings[d.key] === n}
                          onClick={() => setRatings((r) => ({ ...r, [d.key]: n }))}
                          className={cn(
                            "size-8 rounded-lg border text-sm font-medium transition-colors",
                            ratings[d.key] === n ? "border-primary bg-primary text-primary-foreground" : "border-input hover:bg-muted"
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {ratings[d.key] && (
                    <Textarea
                      className="mt-2 min-h-16"
                      placeholder="Your observation (optional)"
                      maxLength={2000}
                      value={notes[d.key] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [d.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={saving || rated === 0}>
                {saving ? "Saving…" : `Save evaluation${rated ? ` (${rated})` : ""}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ History dialog ---------------------------- */
function HistoryDialog({ traineeId, onClose }: { traineeId: string | null; onClose: () => void }) {
  const q = useTrainerQuery<TraineeDetail>(traineeId ? `/skills/trainee/${traineeId}` : null);
  return (
    <Dialog open={!!traineeId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{q.data?.trainee.name ?? "Evaluation history"}</DialogTitle>
          <DialogDescription>Your past skill evaluations for this trainee.</DialogDescription>
        </DialogHeader>
        {q.loading ? (
          <LoadingBlock rows={3} />
        ) : q.error ? (
          <ErrorState message={q.error} onRetry={q.refetch} />
        ) : !q.data || q.data.evaluations.length === 0 ? (
          <EmptyState title="No evaluations yet" hint="Use Evaluate to record your first observation." icon={ClipboardCheck} />
        ) : (
          <ul className="space-y-2">
            {q.data.evaluations.map((e) => (
              <li key={e.id} className="rounded-xl border border-border/60 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{e.label}</span>
                  <Badge variant="secondary">{e.rating}/5</Badge>
                </div>
                {e.observation && <p className="mt-1 text-muted-foreground">{e.observation}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{fmtDate(e.date)}</p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- Page ---------------------------------- */
export function SkillsView() {
  const [batchId, setBatchId] = useState("");
  const q = useTrainerQuery<SkillsResponse>(`/skills${batchId ? `?batch_id=${batchId}` : ""}`);
  const [openSkill, setOpenSkill] = useState<string | null>(null);
  const [evalTarget, setEvalTarget] = useState<{ id: string; name: string; batch_id: string; batch: string } | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const skills = useMemo(() => q.data?.skills ?? [], [q.data]);
  const selected = skills.find((s) => s.skill_id === openSkill) ?? null;
  const overall = skills.length ? Math.round(skills.reduce((a, s) => a + s.average, 0) / skills.length) : 0;
  const evidence = skills.reduce((a, s) => a + s.evidence_count, 0);
  const atRisk = skills.reduce((a, s) => a + s.below_threshold, 0);

  // Unique trainee list for the evaluate picker.
  const roster = useMemo(() => {
    const m = new Map<string, SkillTrainee>();
    skills.forEach((s) => s.trainees.forEach((t) => m.set(t.trainee_id, t)));
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [skills]);
  const filteredRoster = roster.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Progress"
        description="Average proficiency across your trainees, the evidence behind it, and structured evaluations that update each Skill Passport."
        action={
          <select aria-label="Filter by batch" className={selectCls} value={batchId} onChange={(e) => { setBatchId(e.target.value); setOpenSkill(null); }}>
            <option value="">All batches</option>
            {q.data?.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        }
      />

      {q.loading ? (
        <LoadingBlock rows={4} />
      ) : q.error ? (
        <ErrorState message={q.error} onRetry={q.refetch} />
      ) : skills.length === 0 ? (
        <EmptyState title="No skill data yet" hint="Skill proficiency appears once trainees have Skill Passport entries." icon={Award} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Average proficiency" value={`${overall}%`} icon={Award} tint="red" />
            <StatCard label="Trainees" value={String(q.data?.trainee_count ?? 0)} icon={Users} tint="blue" />
            <StatCard label="Evidence entries" value={String(evidence)} icon={ClipboardCheck} tint="green" />
            <StatCard label="Below 60% (skill-trainee)" value={String(atRisk)} icon={TrendingDown} tint="amber" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {skills.map((s) => (
              <button
                key={s.skill_id}
                type="button"
                onClick={() => setOpenSkill(s.skill_id === openSkill ? null : s.skill_id)}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/40",
                  openSkill === s.skill_id ? "border-primary" : "border-border/60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-heading font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.level} · {s.trainee_count} trainees
                    </p>
                  </div>
                  <span className="font-heading text-2xl font-bold">{s.average}%</span>
                </div>
                <Bar value={s.average} />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{s.evidence_count} evidence entries</span>
                  <Trend t={s.trend} />
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <h2 className="font-heading text-lg font-semibold">{selected.name}: trainees</h2>
              <p className="mb-3 text-sm text-muted-foreground">Lowest proficiency first. {selected.below_threshold} below 60%.</p>
              <ul className="divide-y divide-border/60">
                {selected.trainees.map((t) => (
                  <li key={t.trainee_id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <div className="min-w-40 flex-1">
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.batch} · {t.level}
                        {t.verified ? " · Verified" : ""} · {t.evidence_count} evidence
                      </p>
                    </div>
                    <div className="flex w-40 items-center gap-2">
                      <Bar value={t.proficiency} />
                      <span className="w-9 text-right text-sm font-medium">{t.proficiency}%</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setHistoryId(t.trainee_id)}>
                        History
                      </Button>
                      <Button size="sm" onClick={() => setEvalTarget({ id: t.trainee_id, name: t.name, batch_id: t.batch_id, batch: t.batch })}>
                        Evaluate
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Evaluate a trainee</h2>
            <p className="mb-3 text-sm text-muted-foreground">Search for a trainee to record a structured evaluation across six dimensions.</p>
            <Label htmlFor="eval-search" className="sr-only">
              Search trainees
            </Label>
            <Input id="eval-search" placeholder="Search trainee name…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {filteredRoster.map((t) => (
                <li key={t.trainee_id} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.batch}</p>
                  </div>
                  <Button size="sm" onClick={() => setEvalTarget({ id: t.trainee_id, name: t.name, batch_id: t.batch_id, batch: t.batch })}>
                    Evaluate
                  </Button>
                </li>
              ))}
              {filteredRoster.length === 0 && <li className="text-sm text-muted-foreground">No trainees match.</li>}
            </ul>
          </section>
        </>
      )}

      <EvaluateDialog key={evalTarget?.id ?? "none"} trainee={evalTarget} open={!!evalTarget} onClose={() => setEvalTarget(null)} onSaved={q.refetch} />
      <HistoryDialog traineeId={historyId} onClose={() => setHistoryId(null)} />
    </div>
  );
}
