"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trainerPost } from "@/lib/trainer/api";
import { cn } from "@/lib/utils";

export interface TraineeRow {
  id: string;
  trainee_code: string;
  name: string;
  batch: string;
  batch_id: string;
  attendance: number;
  learning: number;
  assessment: number;
  assignment: number;
  skill_readiness: number;
  last_activity: string | null;
  inactive_days: number | null;
  status: "on_track" | "needs_attention" | "at_risk" | "completed" | string;
  status_label: string;
  risk_reasons: string[];
  course_progress?: number;
}

const STATUS_STYLE: Record<string, string> = {
  on_track: "bg-success/10 text-success",
  needs_attention: "bg-warning/15 text-warning",
  at_risk: "bg-destructive/10 text-destructive",
  completed: "bg-blue-50 text-blue-700",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const fallback = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLE[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label || fallback}
    </span>
  );
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const AV_TINTS = [
  "bg-red-100 text-red-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
];

export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  const tint = AV_TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_TINTS.length];
  return (
    <span
      aria-hidden
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold", tint, className)}
    >
      {initials(name)}
    </span>
  );
}

export function barTone(v: number) {
  return v >= 75 ? "bg-success" : v >= 50 ? "bg-warning" : "bg-destructive";
}

export function MetricBar({ label, value, className }: { label: string; value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{v}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={cn("h-full rounded-full", barTone(v))} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function PctCell({ value }: { value: number }) {
  return <span className={cn("tabular-nums font-medium", value < 50 ? "text-destructive" : value < 75 ? "text-warning" : "text-foreground")}>{value}%</span>;
}

export function ReasonChips({ reasons, max = 4 }: { reasons: string[]; max?: number }) {
  if (!reasons?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {reasons.slice(0, max).map((r) => (
        <span key={r} className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
          {r}
        </span>
      ))}
      {reasons.length > max && <span className="text-[11px] text-muted-foreground">+{reasons.length - max} more</span>}
    </div>
  );
}

export function relTime(iso: string | null | undefined) {
  if (!iso) return "No activity yet";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (diff < 0) return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  if (days <= 0) {
    const h = Math.floor(diff / 3600000);
    return h <= 0 ? "Just now" : `${h}h ago`;
  }
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function fmtDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: withTime ? undefined : "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export interface ReminderTarget {
  id: string;
  name: string;
  reasons?: string[];
  /** Compose general feedback instead of a reminder. */
  feedback?: boolean;
}

/** Composes a reminder and POSTs to /trainer/messages. Failures stay in the dialog. */
export function SendReminderDialog({
  target,
  onClose,
  defaultSubject = "Reminder from your trainer",
}: {
  target: ReminderTarget | null;
  onClose: () => void;
  defaultSubject?: string;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {target && <ReminderForm key={target.id} target={target} onClose={onClose} defaultSubject={defaultSubject} />}
      </DialogContent>
    </Dialog>
  );
}

function ReminderForm({
  target,
  onClose,
  defaultSubject,
}: {
  target: ReminderTarget;
  onClose: () => void;
  defaultSubject: string;
}) {
  const first = target.name.split(" ")[0];
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(
    target.feedback
      ? `Hi ${first},\n\nHere is some feedback on your progress so far:\n\n\n\nRegards,\nDr. S. Kumar`
      : `Hi ${first},\n\nI noticed ${target.reasons?.length ? target.reasons.join(", ").toLowerCase() : "some gaps in your recent progress"}. Please catch up on your pending work and reach out if you need any help.\n\nRegards,\nDr. S. Kumar`
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError("Message body is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await trainerPost("/messages", { recipient_id: target.id, subject: subject.trim() || null, body: body.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Reminder sent</DialogTitle>
          <DialogDescription>Your message to {target.name} was delivered.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </>
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Send reminder to {target.name}</DialogTitle>
        <DialogDescription>Compose a short message. The trainee will see it in their inbox.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rem-subject">Subject</Label>
        <Input id="rem-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rem-body">Message</Label>
        <Textarea id="rem-body" rows={7} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Send reminder
        </Button>
      </DialogFooter>
    </form>
  );
}
