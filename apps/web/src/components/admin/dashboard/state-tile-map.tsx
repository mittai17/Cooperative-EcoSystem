"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import type { InstitutionsByState } from "@/lib/admin/admin-api";
import { cn } from "@/lib/utils";
import { STATE_ABBREVIATIONS, formatCount } from "./format";
import { DashboardPanel, EmptyState, PanelSelect } from "./panel";

/**
 * Simplified tile map: one tile per state, shaded by institution count.
 * Avoids shipping geographic boundary data.
 */
const LEGEND: { label: string; min: number; className: string }[] = [
  { label: "50+", min: 50, className: "bg-primary" },
  { label: "20–50", min: 20, className: "bg-[#F26D6F]" },
  { label: "10–20", min: 10, className: "bg-[#F9A8AB]" },
  { label: "5–10", min: 5, className: "bg-[#FBD0D2]" },
  { label: "1–5", min: 1, className: "bg-[#FDEBEC]" },
];

function shadeFor(count: number): string {
  return (LEGEND.find((bucket) => count >= bucket.min) ?? LEGEND[LEGEND.length - 1]).className;
}

export function StateTileMap({ data }: { data: InstitutionsByState[] }) {
  const [selected, setSelected] = useState("All States");
  const states = useMemo(
    () => ["All States", ...data.map((row) => row.state).sort((a, b) => a.localeCompare(b))],
    [data],
  );
  const visible = selected === "All States" ? data : data.filter((row) => row.state === selected);
  const selectedRow = selected === "All States" ? null : data.find((row) => row.state === selected) ?? null;

  return (
    <DashboardPanel
      icon={MapPin}
      title="Institutions by State"
      action={<PanelSelect label="State filter" value={selected} onChange={setSelected} options={states} />}
      className="lg:col-span-1"
    >
      {data.length === 0 ? (
        <EmptyState message="No institutions have been registered yet." />
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <div className="grid grid-cols-4 gap-2" role="list" aria-label="Institutions per state">
            {visible.map((row) => {
              const abbr = STATE_ABBREVIATIONS[row.state] ?? row.state.slice(0, 2).toUpperCase();
              return (
                <button
                  key={row.state}
                  type="button"
                  role="listitem"
                  onClick={() => setSelected(row.state)}
                  title={`${row.state}: ${formatCount(row.count)} institutions`}
                  className={cn(
                    "flex aspect-[4/3] flex-col items-center justify-center rounded-xl text-xs font-semibold transition hover:ring-2 hover:ring-primary/40",
                    shadeFor(row.count),
                    row.count >= 20 ? "text-white" : "text-foreground",
                  )}
                >
                  <span>{abbr}</span>
                  <span className="text-[11px] font-medium opacity-90">{formatCount(row.count)}</span>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedRow
              ? `${selectedRow.state}: ${formatCount(selectedRow.count)} institutions`
              : `${formatCount(data.reduce((sum, row) => sum + row.count, 0))} institutions across ${data.length} states`}
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
            {LEGEND.map((bucket) => (
              <li key={bucket.label} className="flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-full", bucket.className)} aria-hidden />
                {bucket.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardPanel>
  );
}
