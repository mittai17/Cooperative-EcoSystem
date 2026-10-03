"use client";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logisticsService } from "@/lib/logistics/logistics-service";
import { IncidentStatusBadge } from "@/components/logistics/status-badges";
import type { Incident } from "@/lib/logistics/types";

const SEVERITY_COLOUR: Record<Incident["severity"], string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-tint-amber-bg text-tint-amber-fg",
  High: "bg-destructive/15 text-destructive",
  Critical: "bg-destructive text-destructive-foreground",
};

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
  });
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIncidents(logisticsService.getIncidents());
    setReady(true);
    const unsub = logisticsService.subscribe(() => setIncidents(logisticsService.getIncidents()));
    return unsub;
  }, []);

  const active = incidents.filter((i) => !["Resolved", "Closed"].includes(i.status));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Incidents & Support" description="All reported incidents across trips. Full incident lifecycle (Phase 3)." />

      <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
        <AlertTriangle className="size-4 text-warning shrink-0" />
        <span>{active.length} active incident{active.length !== 1 ? "s" : ""} requiring attention. Full incident management (assign, escalate, close) arrives in Phase 3.</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">All Incidents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!ready ? (
            <div className="p-4 flex flex-col gap-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Trip</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Occurred</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((inc) => (
                    <TableRow key={inc.id} className={cn(!["Resolved", "Closed"].includes(inc.status) && inc.severity === "Critical" && "bg-destructive/5")}>
                      <TableCell className="font-mono text-xs">{inc.incidentCode}</TableCell>
                      <TableCell className="font-mono text-xs">{inc.tripCode}</TableCell>
                      <TableCell className="text-sm">{inc.category}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={SEVERITY_COLOUR[inc.severity]}>{inc.severity}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{fmtDt(inc.occurredAt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inc.reporterName}</TableCell>
                      <TableCell><IncidentStatusBadge status={inc.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
