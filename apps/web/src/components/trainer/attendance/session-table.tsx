import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_STYLE, type RosterRow } from "./types";

export function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
      {initials}
    </span>
  );
}

/** Read-only per-trainee table. */
export function SessionTable({ rows }: { rows: RosterRow[] }) {
  return (
    <ul className="divide-y rounded-xl border border-border/60">
      {rows.map((r) => (
        <li key={r.trainee_id} className="flex items-center gap-3 px-3 py-2.5">
          <Avatar initials={r.initials} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{r.name}</p>
            <p className="text-xs text-muted-foreground">
              {r.code}
              {r.time ? ` · ${r.time}` : ""}
              {r.method ? ` · ${r.method}` : ""}
            </p>
          </div>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLE[r.status])}>{STATUS_LABEL[r.status]}</span>
        </li>
      ))}
    </ul>
  );
}
