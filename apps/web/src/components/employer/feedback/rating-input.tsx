"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/** Five-point rating row. Buttons expose aria-pressed so the choice is readable without color. */
export function RatingInput({ label, value, onChange, disabled }: RatingInputProps) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1" role="group" aria-label={`${label} rating`}>
        {[1, 2, 3, 4, 5].map((score) => {
          const active = value !== undefined && score <= value;
          return (
            <button
              key={score}
              type="button"
              disabled={disabled}
              aria-pressed={value === score}
              aria-label={`${score} of 5`}
              onClick={() => onChange(score)}
              className="rounded-full p-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              <Star className={cn("size-5", active ? "fill-primary text-primary" : "text-muted-foreground")} />
            </button>
          );
        })}
        <span className="ml-2 w-8 text-right text-xs text-muted-foreground">{value ? `${value}/5` : "—"}</span>
      </div>
    </div>
  );
}
