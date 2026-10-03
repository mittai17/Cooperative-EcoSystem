"use client";
import { useEffect, useState } from "react";
import { Settings, Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { logisticsService } from "@/lib/logistics/logistics-service";
import type { AuditEvent } from "@/lib/logistics/types";

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
  });
}

export default function SettingsAuditPage() {
  const [log, setLog] = useState<AuditEvent[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLog(logisticsService.getAuditLog());
    setReady(true);
    const unsub = logisticsService.subscribe(() => setLog(logisticsService.getAuditLog()));
    return unsub;
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings & Audit Log"
        description="Notification rules, access configuration and searchable change history."
      />

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Settings className="size-4 shrink-0" />
        Notification rules, approval thresholds and access configuration panels will be available in Phase 3.
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            Change History
          </CardTitle>
          <CardDescription>Every status change, assignment and decision is recorded here with actor, reason and timestamp.</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : log.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No audit events yet. Make changes to plans, trips or requests to start building the history.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {log.map((evt) => (
                <li key={evt.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                  <Clock className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {evt.action.replace(/_/g, " ")} · <span className="font-mono text-xs text-muted-foreground">{evt.entityType}/{evt.entityId}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {evt.actor} · {fmtDt(evt.createdAt)}
                      {evt.reason && ` · "${evt.reason}"`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
