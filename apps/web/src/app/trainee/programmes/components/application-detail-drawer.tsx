"use client";

import { X, FileText, CheckCircle2, Clock, Download, ExternalLink, Calendar, MapPin, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Application } from "@/types/application";
import { generateApplicationId } from "@/lib/store/programme-store"; // Unused here, but kept for type completeness if needed

export function ApplicationDetailDrawer({
  application,
  onClose,
  onWithdraw,
}: {
  application: Application;
  onClose: () => void;
  onWithdraw: () => void;
}) {
  const canWithdraw = !["rejected", "withdrawn", "completed", "batch_allocated"].includes(application.status);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-heading text-lg font-bold">Application Details</h2>
              <Badge variant="outline" className="font-mono text-xs">{application.id}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{application.programmeTitle}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X className="size-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Status Banner */}
          <div className={cn(
            "rounded-xl border p-4",
            application.status === "batch_allocated" || application.status === "completed" ? "bg-green-50 border-green-200" :
            application.status === "correction_required" ? "bg-orange-50 border-orange-200" :
            application.status === "rejected" ? "bg-red-50 border-red-200" :
            "bg-blue-50 border-blue-200"
          )}>
            <p className="text-sm font-bold mb-1">Current Stage: {application.currentStage}</p>
            {application.correctionNote && <p className="text-xs text-orange-700">{application.correctionNote}</p>}
            {application.rejectionReason && <p className="text-xs text-red-700">{application.rejectionReason}</p>}
            {application.batchAllocation && (
              <div className="mt-2 text-xs text-green-800 space-y-0.5">
                <p><strong>Batch:</strong> {application.batchAllocation.batchName}</p>
                <p><strong>Trainer:</strong> {application.batchAllocation.trainerName}</p>
                <p><strong>Schedule:</strong> {new Date(application.batchAllocation.startDate).toLocaleDateString()} — {application.batchAllocation.time}</p>
                <p><strong>Venue:</strong> {application.batchAllocation.room}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground tracking-wider">Application Timeline</h3>
            <div className="space-y-4 pl-2">
              {application.timeline.map((event, i) => (
                <div key={event.id} className="relative pl-6">
                  {i !== application.timeline.length - 1 && (
                    <div className="absolute left-1.5 top-5 bottom-[-16px] w-px bg-border" />
                  )}
                  <div className="absolute left-0 top-1 size-3 rounded-full border-2 border-primary bg-background" />
                  <p className="text-sm font-medium">{event.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(event.timestamp).toLocaleString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })} • by {event.actor}
                  </p>
                  {event.note && (
                    <div className="mt-1.5 rounded bg-muted/50 p-2 text-xs italic text-muted-foreground border-l-2 border-border">
                      &quot;{event.note}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submitted Data */}
          <div>
            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground tracking-wider">Submitted Details</h3>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              <div className="p-4 grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Name</p><p className="text-sm font-medium">{application.traineeName}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm font-medium">{application.personalInfo?.phone}</p></div>
                <div><p className="text-xs text-muted-foreground">Cooperative</p><p className="text-sm font-medium">{application.personalInfo?.cooperativeMembership}</p></div>
                <div><p className="text-xs text-muted-foreground">Experience</p><p className="text-sm font-medium">{application.personalInfo?.experience}</p></div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Language</p><p className="text-sm font-medium">{application.preferences.preferredLanguage}</p></div>
                <div><p className="text-xs text-muted-foreground">Batch Preference</p><p className="text-sm font-medium">{application.preferences.preferredBatch}</p></div>
                <div><p className="text-xs text-muted-foreground">Hostel</p><p className="text-sm font-medium">{application.preferences.hostelRequired ? "Required" : "Not Required"}</p></div>
                <div><p className="text-xs text-muted-foreground">Meals</p><p className="text-sm font-medium">{application.preferences.mealRequired ? "Required" : "Not Required"}</p></div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground tracking-wider">Uploaded Documents</h3>
            <div className="space-y-2">
              {application.documents.map((doc) => (
                <div key={doc.type} className="flex items-center justify-between rounded-lg border p-3 bg-card">
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium leading-none">{doc.label}</p>
                      {doc.fileName && <p className="text-xs text-muted-foreground mt-1">{doc.fileName}</p>}
                    </div>
                  </div>
                  <Badge variant={doc.status === "verified" ? "default" : "outline"} className={doc.status === "verified" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border p-5 flex justify-between bg-muted/20">
          {canWithdraw ? (
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onWithdraw}>
              Withdraw Application
            </Button>
          ) : (
            <div />
          )}
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </>
  );
}
