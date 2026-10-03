import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardPanelProps {
  id?: string;
  icon?: LucideIcon;
  title: string;
  action?: ReactNode;
  /** Optional "View All" style link on the right. */
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
  children: ReactNode;
}

export function DashboardPanel({
  id,
  icon: Icon,
  title,
  action,
  viewAllHref,
  viewAllLabel = "View All",
  className,
  children,
}: DashboardPanelProps) {
  return (
    <section
      id={id}
      className={cn("flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm", className)}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 font-heading text-base font-semibold text-foreground">
          {Icon ? <Icon className="size-4.5 shrink-0 text-primary" aria-hidden /> : null}
          <span className="truncate">{title}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {viewAllHref ? (
            <Link href={viewAllHref} className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline">
              {viewAllLabel}
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}

export function PanelSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground outline-none focus-visible:border-primary"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
