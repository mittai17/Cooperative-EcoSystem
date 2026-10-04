"use client";

import { ListFilter } from "lucide-react";
import { DonutChart, DonutLegend, type DonutSlice } from "@/components/dashboard/charts";
import type { CandidateSource } from "@/lib/employer/jobs-api";
import { SectionCard, SectionEmpty, SectionError, SectionSkeleton } from "./section-shell";

const SOURCE_COLORS = [
  "var(--color-primary)",
  "oklch(0.68 0.18 27)",
  "oklch(0.78 0.12 27)",
  "oklch(0.88 0.05 27)",
  "oklch(0.42 0.19 27)",
];

export function CandidateSourceDonut({
  sources,
  total,
  loading,
  error,
  onRetry,
}: {
  sources: CandidateSource[] | null;
  total: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <SectionCard title="Candidate Source" icon={ListFilter}>
      {error ? (
        <SectionError onRetry={onRetry} />
      ) : loading || sources === null ? (
        <SectionSkeleton rows={4} />
      ) : sources.length === 0 || total === 0 ? (
        <SectionEmpty title="No sources yet" body="Source breakdown appears once candidates apply to your jobs." />
      ) : (
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
          <DonutChart
            data={toSlices(sources)}
            height={190}
            innerRadius={56}
            outerRadius={84}
            centerValue={String(total)}
            centerLabel="Applications"
          />
          <DonutLegend data={toSlices(sources)} valueFormatter={(v) => `${v}%`} />
        </div>
      )}
    </SectionCard>
  );
}

function toSlices(sources: CandidateSource[]): DonutSlice[] {
  return sources.map((source, index) => ({
    key: source.label,
    label: source.label,
    value: source.percent,
    color: SOURCE_COLORS[index % SOURCE_COLORS.length],
  }));
}
