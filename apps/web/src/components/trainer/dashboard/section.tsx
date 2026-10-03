import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { cn } from "@/lib/utils";

/** Card shell with per-section loading / error / empty handling. */
export function Section({
  title,
  icon: Icon,
  href,
  hrefLabel = "View all",
  loading,
  error,
  onRetry,
  empty,
  emptyMessage,
  emptyHint,
  skeletonRows = 3,
  className,
  children,
  action,
}: {
  title: string;
  icon?: LucideIcon;
  href?: string;
  hrefLabel?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyMessage?: string;
  emptyHint?: string;
  skeletonRows?: number;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm", className)}>
      <header className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          {title}
        </h2>
        {action}
        {href && !action && (
          <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            {hrefLabel} <ArrowRight className="size-3" />
          </Link>
        )}
      </header>
      {loading ? (
        <LoadingBlock rows={skeletonRows} />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : empty ? (
        <EmptyState title={emptyMessage ?? "Nothing to show."} hint={emptyHint} />
      ) : (
        children
      )}
    </section>
  );
}
