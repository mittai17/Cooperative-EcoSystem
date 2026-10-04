import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Shared card frame for every dashboard section: icon + title, optional "View All" link. */
export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  className,
  headerRight,
}: {
  title: string;
  icon?: LucideIcon;
  action?: { label: string; href: string };
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex min-w-0 items-center gap-2 font-heading text-base">
          {Icon && <Icon className="size-4 shrink-0 text-primary" />}
          <span className="truncate">{title}</span>
        </CardTitle>
        <div className="flex shrink-0 items-center gap-2">
          {headerRight}
          {action && (
            <Link href={action.href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              {action.label} <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SectionSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)} aria-busy="true" aria-label="Loading section">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function SectionEmpty({ title, body, cta }: { title: string; body: string; cta?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{body}</p>
      {cta && (
        <Button size="sm" variant="outline" render={<Link href={cta.href} />}>
          {cta.label}
        </Button>
      )}
    </div>
  );
}

export function SectionError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-6 text-sm">
      <p className="font-medium text-destructive">This section could not be loaded.</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").split(/\s+/).filter(Boolean).slice(0, 2);
  return parts
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
