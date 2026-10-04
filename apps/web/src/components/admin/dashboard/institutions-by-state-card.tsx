"use client";

import { useState } from "react";
import { BarChart2, ChevronDown } from "lucide-react";
import { IndiaInstitutionsMap } from "./india-institutions-map";

export function InstitutionsByStateCard() {
  const [selectedState, setSelectedState] = useState("All States");

  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
          <BarChart2 className="size-4.5 text-red-600" />
          <span>Institutions by State</span>
        </h2>
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            <span>{selectedState}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* India Map & Legend */}
      <div className="flex-1 flex items-center justify-center">
        <IndiaInstitutionsMap />
      </div>
    </div>
  );
}
