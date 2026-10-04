"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface StateData {
  id: string;
  name: string;
  count: number;
  tier: "50+" | "20-50" | "10-20" | "5-10" | "1-5";
  path: string;
}

const LEGEND = [
  { label: "50+", color: "#B91C1C", count: "50+" },
  { label: "20–50", color: "#EF4444", count: "20-50" },
  { label: "10–20", color: "#F87171", count: "10-20" },
  { label: "5–10", color: "#FCA5A5", count: "5-10" },
  { label: "1–5", color: "#FECDD3", count: "1-5" },
];

export function IndiaInstitutionsMap() {
  const [hoveredState, setHoveredState] = useState<{ name: string; count: number } | null>(null);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[220px] px-2 py-1">
      {/* Map visual */}
      <div className="relative flex-1 w-full max-w-[280px] h-[240px] flex items-center justify-center">
        <svg
          viewBox="0 0 350 400"
          className="w-full h-full drop-shadow-sm transition-all"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base India outline / Northern Regions (J&K, Ladakh, Himachal, Uttarakhand) */}
          <path
            d="M 125 35 Q 140 15 155 30 Q 170 20 180 40 L 195 65 Q 185 85 175 95 L 155 90 L 140 100 L 130 85 Z"
            fill="#FECDD3"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "Jammu & Kashmir / Ladakh", count: 4 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Northern Region: 4 Institutions</title>
          </path>

          {/* Punjab / Haryana / Delhi */}
          <path
            d="M 115 95 L 140 100 L 155 90 L 160 115 L 145 125 L 120 120 Z"
            fill="#FCA5A5"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "Punjab & Haryana & Delhi", count: 9 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Delhi NCR: 9 Institutions</title>
          </path>

          {/* Rajasthan */}
          <path
            d="M 75 115 L 115 95 L 125 120 L 135 155 L 100 175 L 70 145 Z"
            fill="#FCA5A5"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "Rajasthan", count: 8 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Rajasthan: 8 Institutions</title>
          </path>

          {/* Uttar Pradesh */}
          <path
            d="M 145 110 L 175 95 L 215 125 L 210 150 L 165 155 L 145 125 Z"
            fill="#FCA5A5"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "Uttar Pradesh", count: 7 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Uttar Pradesh: 7 Institutions</title>
          </path>

          {/* Gujarat */}
          <path
            d="M 50 170 Q 75 160 95 175 L 85 210 Q 55 215 45 195 Q 40 180 50 170 Z"
            fill="#EF4444"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "Gujarat", count: 28 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Gujarat: 28 Institutions</title>
          </path>

          {/* Madhya Pradesh */}
          <path
            d="M 100 175 L 165 155 L 195 180 L 180 215 L 125 215 L 90 200 Z"
            fill="#FCA5A5"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "Madhya Pradesh", count: 9 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Madhya Pradesh: 9 Institutions</title>
          </path>

          {/* Bihar & Jharkhand */}
          <path
            d="M 215 125 L 255 135 L 250 170 L 210 175 L 205 150 Z"
            fill="#FECDD3"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "Bihar & Jharkhand", count: 4 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Bihar & Jharkhand: 4 Institutions</title>
          </path>

          {/* West Bengal & North-East */}
          <path
            d="M 255 135 Q 275 120 295 125 L 330 135 L 320 160 L 290 170 L 270 185 L 250 170 Z"
            fill="#FECDD3"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "West Bengal & North-East", count: 5 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Eastern Region: 5 Institutions</title>
          </path>

          {/* Odisha */}
          <path
            d="M 195 185 L 245 175 L 235 215 L 190 220 Z"
            fill="#FECDD3"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "Odisha", count: 3 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Odisha: 3 Institutions</title>
          </path>

          {/* Maharashtra - Highest density (50+) - Deep Red */}
          <path
            d="M 85 210 L 125 215 L 165 215 L 155 265 L 105 260 L 80 230 Z"
            fill="#B91C1C"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            className="hover:opacity-90 transition-opacity cursor-pointer filter drop-shadow-xs"
            onMouseEnter={() => setHoveredState({ name: "Maharashtra", count: 52 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Maharashtra: 52 Institutions (Highest)</title>
          </path>

          {/* Telangana & Andhra Pradesh */}
          <path
            d="M 145 235 L 185 220 L 195 265 L 160 305 L 140 265 Z"
            fill="#F87171"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "Telangana & Andhra Pradesh", count: 12 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Telangana & Andhra Pradesh: 12 Institutions</title>
          </path>

          {/* Karnataka & Goa */}
          <path
            d="M 100 260 L 140 265 L 145 320 L 115 325 L 95 280 Z"
            fill="#F87171"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "Karnataka", count: 22 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Karnataka: 22 Institutions</title>
          </path>

          {/* Tamil Nadu & Kerala */}
          <path
            d="M 115 325 L 155 305 L 140 370 Q 130 380 120 370 L 110 345 Z"
            fill="#F87171"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            className="hover:opacity-85 transition-opacity cursor-pointer"
            onMouseEnter={() => setHoveredState({ name: "Tamil Nadu & Kerala", count: 19 })}
            onMouseLeave={() => setHoveredState(null)}
          >
            <title>Tamil Nadu & Kerala: 19 Institutions</title>
          </path>
        </svg>

        {hoveredState && (
          <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[11px] font-medium px-2 py-1 rounded-md shadow-md pointer-events-none backdrop-blur">
            <span className="font-bold">{hoveredState.name}</span>: {hoveredState.count} institutions
          </div>
        )}
      </div>

      {/* Legend on the right matching reference image */}
      <div className="flex flex-col gap-2 shrink-0 pr-4">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span
              className="size-3 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
