"use client";

import { useState } from "react";
import { BarChart2, ChevronDown } from "lucide-react";
import { IndiaInstitutionsMap } from "./india-institutions-map";

export function InstitutionsByStateCard() {
  const [selectedState, setSelectedState] = useState("All States");

  return (
    <div className="flex flex-col justify-between h-full rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900 dark:text-foreground">
          <BarChart2 className="size-4.5 text-[#E30B1C]" />
          <span>Institutions by State</span>
        </h2>
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white dark:bg-card px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-foreground hover:bg-slate-50 cursor-pointer"
          >
            <span>{selectedState}</span>
            <ChevronDown className="size-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* India Map & Legend */}
      <div className="flex-1 flex items-center justify-center my-auto">
        <IndiaInstitutionsMap />
      </div>
    </div>
  );
}
