import { Info } from "lucide-react";

/** Shown whenever a screen falls back to demo rows because the API failed. */
export function DemoBanner({ message }: { message?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
      <Info className="size-4 shrink-0" aria-hidden />
      <span className="demo-data-tag">Demo data (fictional)</span>
      <span className="text-xs">{message ?? "The live service could not be reached, so sample rows are shown."}</span>
    </div>
  );
}
