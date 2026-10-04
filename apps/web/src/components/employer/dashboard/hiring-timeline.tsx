"use client";

import { TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendLineChart } from "@/components/dashboard/charts";
import type { TimelinePoint, TimelineRange } from "@/lib/employer/jobs-api";
import { SectionCard, SectionEmpty, SectionError, SectionSkeleton } from "./section-shell";

const RANGE_OPTIONS: { label: string; value: TimelineRange }[] = [
  { label: "Last 3 months", value: "3m" },
  { label: "Last 6 months", value: "6m" },
  { label: "Last 1 year", value: "1y" },
];

const SERIES = [
  { key: "applications", label: "Applications", color: "var(--color-primary)" },
  { key: "interviews", label: "Interviews", color: "oklch(0.55 0.15 255)" },
  { key: "hired", label: "Hired", color: "oklch(0.6 0.15 150)" },
];

export function HiringTimeline({
  points,
  range,
  loading,
  error,
  busy,
  onRangeChange,
  onRetry,
}: {
  points: TimelinePoint[] | null;
  range: TimelineRange;
  loading: boolean;
  error: boolean;
  busy: boolean;
  onRangeChange: (range: TimelineRange) => void;
  onRetry: () => void;
}) {
  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "Last 6 months";
  return (
    <SectionCard
      title="Hiring Timeline"
      icon={TrendingUp}
      headerRight={
        <Select
          items={RANGE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          value={range}
          onValueChange={(v) => v && onRangeChange(v as TimelineRange)}
        >
          <SelectTrigger size="sm" className="w-36" aria-label="Hiring timeline range">
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
      {error ? (
        <SectionError onRetry={onRetry} />
      ) : loading || points === null ? (
        <SectionSkeleton rows={3} />
      ) : !Array.isArray(points) || points.length === 0 ? (
        <SectionEmpty title="No timeline data" body="Monthly applications, interviews and hires show here." />
      ) : (
        <div className="flex flex-col gap-3" aria-busy={busy}>
          <TrendLineChart data={points.map((p) => ({ month: p.month, applications: p.applications, interviews: p.interviews, hired: p.hired }))} xKey="month" series={SERIES} height={190} />
          <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {SERIES.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
