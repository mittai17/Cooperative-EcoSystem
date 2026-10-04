import type { ReactNode } from "react";
import { RefreshCw, SearchX } from "lucide-react";

import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import { initials } from "./people-utils";

/** Initials avatar. Never a photo. */
export function PersonAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint-red-bg text-xs font-semibold text-tint-red-fg"
    >
      {initials(name)}
    </span>
  );
}

/** White list card: toolbar, table area, pager. The table scrolls inside this card on small screens. */
export function ListCard({
  toolbar,
  children,
  pager,
}: {
  toolbar: ReactNode;
  children: ReactNode;
  pager: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {toolbar}
      <div className="px-4">{children}</div>
      {pager}
    </section>
  );
}

/** Error state for a failed list or lookup request. Pairs the message with the labelled demo banner. */
export function ListNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <DemoBanner message={message} />
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-3.5" aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}

export function TableLoading({ label }: { label: string }) {
  return (
    <div className="space-y-2 py-2" aria-busy="true" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function EmptyRows({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
      <SearchX className="size-8" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

/** White form card with a title and subtitle header. */
export function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="mb-6 border-b border-border pb-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}

export function FormField({
  id,
  label,
  required = false,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-primary">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Bottom row of a form: required-field note on the left, Cancel and submit on the right. */
export function FormFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
      <p className="mr-auto text-xs text-muted-foreground">
        <span aria-hidden="true" className="text-primary">
          *
        </span>{" "}
        Required fields
      </p>
      {children}
    </div>
  );
}
