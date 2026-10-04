"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  /** False when the API does not return the field needed to filter on it. */
  supported?: boolean;
  unsupportedHint?: string;
}

/** Labelled single-value filter. Disabled with an explicit hint when the data behind it is not available. */
export function FilterSelect({ id, label, value, options, onChange, supported = true, unsupportedHint }: FilterSelectProps) {
  const items = options.map((option) => ({ label: option.label, value: option.value }));
  return (
    <div className="flex min-w-36 flex-1 flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Select items={items} value={value} onValueChange={(next) => next && onChange(String(next))} disabled={!supported}>
        <SelectTrigger id={id} className="w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!supported && unsupportedHint && <p className="text-[11px] text-muted-foreground">{unsupportedHint}</p>}
    </div>
  );
}
