import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional pill beside the title, for example a "Beta" marker. */
  badge?: ReactNode;
  action?: ReactNode;
}

export function AdminPageHeader({ icon: Icon, title, description, badge, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tint-red-bg text-tint-red-fg">
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {badge}
          </div>
          {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

/** Small pill used next to page titles, such as "Beta". */
export function AdminBetaBadge({ label = "Beta" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
      {label}
    </span>
  );
}
