import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/*
 * Visual building blocks shared by the NCCT admin list and form pages that
 * this agent owns (programmes, skill passport, jobs, assessments, certifications,
 * reports, settings, audit logs). Colours come from theme tokens only.
 */

export const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

export const textareaClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

export const tableClass = "w-full min-w-[640px] text-left text-sm";
export const thClass =
  "whitespace-nowrap border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
export const tdClass = "border-b border-border/70 px-4 py-3 align-middle text-foreground last:border-0";
export const rowClass = "transition-colors hover:bg-muted/50";

export const viewButtonClass =
  "inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:border-primary hover:text-primary";

export const primaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-60";

/** White rounded card that holds a list page (toolbar, table and pager). */
export function ListCard({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">{children}</div>;
}

/** Horizontal scroll stays inside the table card, never on the page. */
export function TableScroll({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto px-1 pb-1">{children}</div>;
}

/** Labelled demo fallback shown inside a list card when the live API fails. */
export function ListErrorBanner({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  if (!error) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
      <DemoBanner />
      <span className="text-xs text-muted-foreground">Live data unavailable: {error}</span>
      <button type="button" onClick={onRetry} className="text-xs font-semibold text-primary hover:underline">
        Retry
      </button>
    </div>
  );
}

export function TableSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3 p-5" aria-busy="true" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="m-5 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

/** Light panel that shows the details of the row the user opened with View. */
export function DetailPanel({ title, children, onClose, closeLabel }: { title: string; children: ReactNode; onClose: () => void; closeLabel: string }) {
  return (
    <div className="mx-5 mb-3 flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4">
      <div className="min-w-0">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <div className="mt-1 text-sm text-muted-foreground">{children}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-background hover:text-foreground"
      >
        Close
      </button>
    </div>
  );
}

/** Two-column form card. Pass fields as children inside a grid. */
export function FormCard({
  title,
  description,
  onSubmit,
  children,
}: {
  title: string;
  description: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </form>
  );
}

/** Label wrapper. Required fields get a red asterisk. Errors render under the control. */
export function FormField({
  label,
  required = false,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-primary" aria-hidden>
            *
          </span>
        ) : null}
      </span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function FormActions({
  cancelHref,
  submitting,
  submitLabel,
  submittingLabel,
  serverError,
}: {
  cancelHref: string;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  serverError: string | null;
}) {
  const t = useT();
  return (
    <>
      {serverError ? (
        <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground hover:bg-muted"
        >
          {t("common.cancel", "Cancel")}
        </Link>
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </>
  );
}

/** Round initials avatar. Never uses a photo. */
export function InitialsAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint-red-bg text-xs font-semibold text-tint-red-fg"
    >
      {initialsOf(name)}
    </span>
  );
}

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}
