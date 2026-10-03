import type { ReactNode } from "react";
import { Search, RotateCcw } from "lucide-react";

interface AdminToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  onReset?: () => void;
}

export function AdminToolbar({ search, onSearch, placeholder = "Search…", filters, onReset }: AdminToolbarProps) {
  return (
    <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
      <label className="relative flex min-w-0 flex-1 items-center">
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {filters}
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface AdminSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function AdminSelect({ label, value, onChange, options }: AdminSelectProps) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
