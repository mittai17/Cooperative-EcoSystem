"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Settings,
  Clock,
  Bell,
  Shield,
  Search,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logisticsService } from "@/lib/logistics/logistics-service";
import type { AuditEvent } from "@/lib/logistics/types";

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

export default function SettingsAuditPage() {
  const [log, setLog] = useState<AuditEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("audit");

  // Operational settings state
  const [smsDepartureAlerts, setSmsDepartureAlerts] = useState(true);
  const [incidentEscalation, setIncidentEscalation] = useState(true);
  const [autoApproveExpenseUnder, setAutoApproveExpenseUnder] = useState("1000");
  const [speedLimitWarningKm, setSpeedLimitWarningKm] = useState("65");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setLog(logisticsService.getAuditLog());
    setReady(true);
    const unsub = logisticsService.subscribe(() => setLog(logisticsService.getAuditLog()));
    return unsub;
  }, []);

  const handleSaveSettings = () => {
    setSavedNotice("Logistics controls & threshold rules updated successfully.");
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const filteredLog = useMemo(() => {
    return log.filter((evt) => {
      if (actionFilter !== "ALL" && evt.action !== actionFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          evt.action.toLowerCase().includes(q) ||
          evt.actor.toLowerCase().includes(q) ||
          evt.entityId.toLowerCase().includes(q) ||
          evt.reason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [log, actionFilter, search]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(log.map((l) => l.action)));
  }, [log]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Settings & Audit Log"
        description="Configure fleet notification rules, approval thresholds, and inspect historical audit logs."
      />

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="size-4 shrink-0" />
          {savedNotice}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="audit" className="gap-2">
            <Clock className="size-4" />
            Audit History ({log.length})
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Sliders className="size-4" />
            Operational Rules & Controls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    Change History & Decision Log
                  </CardTitle>
                  <CardDescription>
                    Every vehicle assignment, plan approval, and incident resolution is chronologically logged.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search actor or entity..."
                      className="pl-8 text-xs"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={actionFilter} onValueChange={(val) => val && setActionFilter(val)}>
                    <SelectTrigger className="w-44 text-xs">
                      <SelectValue placeholder="Action type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Actions</SelectItem>
                      {uniqueActions.map((act) => (
                        <SelectItem key={act} value={act}>
                          {act.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!ready ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : filteredLog.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No audit events matched the filter.
                </p>
              ) : (
                <ol className="flex flex-col gap-2.5">
                  {filteredLog.map((evt) => (
                    <li
                      key={evt.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-3.5 text-sm transition-colors hover:bg-muted/30"
                    >
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-0.5">
                        <Clock className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-foreground">
                            {evt.action.replace(/_/g, " ")}
                          </p>
                          <span className="font-mono text-xs text-muted-foreground">
                            {fmtDt(evt.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <strong>{evt.actor}</strong> ({evt.actorRole}) · Target:{" "}
                          <span className="font-mono text-foreground font-medium">
                            {evt.entityType}/{evt.entityId}
                          </span>
                        </p>
                        {evt.reason && (
                          <p className="text-xs text-foreground/80 mt-1 italic bg-muted/30 rounded p-1.5 border border-border/50">
                            &ldquo;{evt.reason}&rdquo;
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Bell className="size-4 text-primary" />
                Fleet Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure real-time alerts sent to trainees, drivers, and transport supervisors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <Label className="font-medium text-foreground">Trainee Departure SMS & WhatsApp Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Send automated pickup countdown alerts 15 minutes before scheduled bus arrival.
                  </p>
                </div>
                <Switch checked={smsDepartureAlerts} onCheckedChange={setSmsDepartureAlerts} />
              </div>

              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <Label className="font-medium text-foreground">Immediate Incident Broadcast</Label>
                  <p className="text-xs text-muted-foreground">
                    Alert the campus security desk and training director when high-severity transit delays occur.
                  </p>
                </div>
                <Switch checked={incidentEscalation} onCheckedChange={setIncidentEscalation} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <Label className="text-xs font-semibold">Auto-Approve Fuel & Toll Under (₹)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    value={autoApproveExpenseUnder}
                    onChange={(e) => setAutoApproveExpenseUnder(e.target.value)}
                  />
                  <span className="text-[11px] text-muted-foreground">Receipts under this amount bypass manual finance sign-off.</span>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Speed Warning Threshold (km/h)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    value={speedLimitWarningKm}
                    onChange={(e) => setSpeedLimitWarningKm(e.target.value)}
                  />
                  <span className="text-[11px] text-muted-foreground">GPS telemetry trigger for overspeed notifications.</span>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button onClick={handleSaveSettings}>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
