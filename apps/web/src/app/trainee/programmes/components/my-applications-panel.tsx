"use client";

import { useState, useMemo } from "react";
import { ChevronRight, Eye, FileText, Clock, CheckCircle2, XCircle, AlertCircle, RotateCcw, X, Download, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types/application";
import { useApplications } from "@/lib/store/programme-store";
import { ApplicationDetailDrawer } from "./application-detail-drawer";

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string; icon: React.ElementType }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-muted-foreground/30", icon: FileText },
  submitted: { label: "Submitted", className: "bg-blue-50 text-blue-700 border-blue-200", icon: ChevronRight },
  pending_trainer: { label: "Pending Approval", className: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  correction_required: { label: "Correction Required", className: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertCircle },
  resubmitted: { label: "Resubmitted", className: "bg-blue-50 text-blue-700 border-blue-200", icon: RotateCcw },
  trainer_approved: { label: "Trainer Approved", className: "bg-teal-50 text-teal-700 border-teal-200", icon: CheckCircle2 },
  pending_institution: { label: "Pending Institution", className: "bg-violet-50 text-violet-700 border-violet-200", icon: Clock },
  institution_approved: { label: "Seat Confirmed", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  batch_allocated: { label: "Batch Confirmed", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  waitlisted: { label: "Waitlisted", className: "bg-violet-50 text-violet-700 border-violet-200", icon: Clock },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground border-muted-foreground/30", icon: X },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
};

const TAB_FILTERS: { label: string; statuses: ApplicationStatus[] | "all" }[] = [
  { label: "All", statuses: "all" },
  { label: "Draft", statuses: ["draft"] },
  { label: "Submitted", statuses: ["submitted", "pending_trainer", "resubmitted"] },
  { label: "Pending", statuses: ["pending_trainer", "pending_institution"] },
  { label: "Correction", statuses: ["correction_required"] },
  { label: "Approved", statuses: ["trainer_approved", "institution_approved", "batch_allocated"] },
  { label: "Rejected", statuses: ["rejected"] },
  { label: "Completed", statuses: ["completed"] },
  { label: "Withdrawn", statuses: ["withdrawn"] },
];

export function MyApplicationsPanel({ traineeId }: { traineeId: string }) {
  const { getByTrainee, withdrawApplication } = useApplications();
  const apps = getByTrainee(traineeId);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const filtered = useMemo(() => {
    const tab = TAB_FILTERS.find((t) => t.label === activeTab);
    if (!tab || tab.statuses === "all") return apps;
    return apps.filter((a) => (tab.statuses as ApplicationStatus[]).includes(a.status));
  }, [apps, activeTab]);

  const handleWithdraw = (appId: string) => {
    if (window.confirm("Are you sure you want to withdraw this application? This cannot be undone.")) {
      withdrawApplication(appId);
      setSelectedApp(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1.5">
        {TAB_FILTERS.map((tab) => {
          const count = tab.statuses === "all"
            ? apps.length
            : apps.filter((a) => (tab.statuses as ApplicationStatus[]).includes(a.status)).length;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.label
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  activeTab === tab.label ? "bg-primary-foreground/20 text-primary-foreground" : "bg-foreground/10 text-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center rounded-2xl border border-dashed border-border bg-muted/20">
          <FileText className="size-10 text-muted-foreground/40" />
          <p className="font-medium text-foreground">No applications in this category</p>
          <p className="text-sm text-muted-foreground">Apply for a programme to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const config = STATUS_CONFIG[app.status];
            const StatusIcon = config.icon;
            const canWithdraw = !["rejected", "withdrawn", "completed", "batch_allocated"].includes(app.status);

            return (
              <div
                key={app.id}
                className="group relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md cursor-pointer"
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* ID + status */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-muted-foreground">{app.id}</span>
                      <Badge className={cn("text-xs border", config.className)}>
                        <StatusIcon className="size-2.5 mr-0.5" />
                        {config.label}
                      </Badge>
                    </div>
                    {/* Programme title */}
                    <p className="font-heading text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {app.programmeTitle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{app.institutionName}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    Submitted {new Date(app.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="size-3" />
                    {app.currentStage}
                  </span>
                </div>

                {/* Correction note */}
                {app.status === "correction_required" && app.correctionNote && (
                  <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-2.5 text-xs text-orange-700">
                    <p className="font-medium mb-0.5">Correction Required:</p>
                    <p className="line-clamp-2">{app.correctionNote}</p>
                  </div>
                )}

                {/* Batch info */}
                {app.status === "batch_allocated" && app.batchAllocation && (
                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-2.5 text-xs text-green-700">
                    <p className="font-medium">Batch: {app.batchAllocation.batchName}</p>
                    <p>Trainer: {app.batchAllocation.trainerName} • Room: {app.batchAllocation.room} • Seat #{app.batchAllocation.seatNumber}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedApp(app)}>
                    <Eye className="size-3 mr-1" /> View
                  </Button>
                  {canWithdraw && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleWithdraw(app.id)}
                    >
                      Withdraw
                    </Button>
                  )}
                  {app.status === "completed" && (
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Download className="size-3 mr-1" /> Certificate
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      {selectedApp && (
        <ApplicationDetailDrawer
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onWithdraw={() => handleWithdraw(selectedApp.id)}
        />
      )}
    </div>
  );
}
