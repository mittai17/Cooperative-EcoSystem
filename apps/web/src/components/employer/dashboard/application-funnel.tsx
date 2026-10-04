"use client";

import { useState } from "react";
import { ChevronRight, Eye, FileText, Gift, ListChecks, Trophy, Video, Filter, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FunnelRange, FunnelStage } from "@/lib/employer/jobs-api";
import { cn } from "@/lib/utils";
import { SectionCard, SectionError, SectionSkeleton } from "./section-shell";

const STAGE_ICON: Record<FunnelStage["key"], LucideIcon> = {
  applied: FileText,
  screened: Eye,
  shortlisted: ListChecks,
  interview: Video,
  offered: Gift,
  hired: Trophy,
};

const RANGE_OPTIONS: { label: string; value: FunnelRange }[] = [
  { label: "Last 30 days", value: "30d" },
  { label: "Last 3 months", value: "3m" },
  { label: "Last 6 months", value: "6m" },
  { label: "Custom range", value: "custom" },
];

export interface CustomRange {
  from: string;
  to: string;
}

interface ApplicationFunnelProps {
  stages: FunnelStage[] | null;
  loading: boolean;
  error: boolean;
  range: FunnelRange;
  customRange: CustomRange;
  busy: boolean;
  onRangeChange: (range: FunnelRange) => void;
  onApplyCustom: (range: CustomRange) => void;
  onRetry: () => void;
}

/** Stage tints step from pale red at the top of the funnel to a deep red before the green "Hired" stage. */
const STAGE_TINT = [
  "bg-red-50 text-red-400 dark:bg-red-950/30",
  "bg-red-100 text-red-500 dark:bg-red-950/40",
  "bg-red-200 text-red-600 dark:bg-red-900/40",
  "bg-red-300 text-red-700 dark:bg-red-900/60",
  "bg-red-400 text-white",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40",
];

export function ApplicationFunnel({
  stages,
  loading,
  error,
  range,
  customRange,
  busy,
  onRangeChange,
  onApplyCustom,
  onRetry,
}: ApplicationFunnelProps) {
  const [draft, setDraft] = useState<CustomRange>(customRange);
  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "Last 3 months";

  return (
    <SectionCard
      title="Application Funnel"
      icon={Filter}
      headerRight={
        <Select
          items={RANGE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          value={range}
          onValueChange={(v) => v && onRangeChange(v as FunnelRange)}
        >
          <SelectTrigger size="sm" className="w-40" aria-label="Funnel date range">
            <SelectValue>{rangeLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {range === "custom" && (
        <form
          className="mb-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.from && draft.to && draft.from <= draft.to) onApplyCustom(draft);
          }}
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="funnel-from" className="text-xs">From</Label>
            <Input id="funnel-from" type="date" className="h-8 w-40" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="funnel-to" className="text-xs">To</Label>
            <Input id="funnel-to" type="date" className="h-8 w-40" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
          </div>
          <Button type="submit" size="sm" disabled={busy || !draft.from || !draft.to || draft.from > draft.to}>
            Apply range
          </Button>
          {draft.from && draft.to && draft.from > draft.to && (
            <p className="text-xs text-destructive">The start date must be before the end date.</p>
          )}
        </form>
      )}

      {error ? (
        <SectionError onRetry={onRetry} />
      ) : loading || stages === null ? (
        <SectionSkeleton rows={2} />
      ) : stages.length === 0 || stages[0].count === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No applications in this period yet.</p>
      ) : (
        <div className={cn("flex flex-col gap-4", busy && "opacity-60")} aria-busy={busy}>
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {stages.map((stage, index) => {
              const Icon = STAGE_ICON[stage.key];
              return (
                <li key={stage.key} className="flex flex-col gap-2">
                  <div className={cn("flex flex-col items-center gap-1.5 rounded-xl px-2 py-4", STAGE_TINT[index] ?? STAGE_TINT[0])}>
                    <Icon className="size-5" aria-hidden />
                    <span className="font-heading text-xl font-bold tabular-nums">{stage.count}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-foreground">{stage.label}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">{stage.percent}% of applied</p>
                    {stage.conversion !== null && (
                      <p className="flex items-center justify-center gap-0.5 text-[11px] text-muted-foreground tabular-nums">
                        <ChevronRight className="size-3" aria-hidden /> {stage.conversion}% conversion
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </SectionCard>
  );
}
