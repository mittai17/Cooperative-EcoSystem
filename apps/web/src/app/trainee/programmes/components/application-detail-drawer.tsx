"use client";

import { X, FileText, CheckCircle2, Clock, Download, ExternalLink, Calendar, MapPin, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Application } from "@/types/application";
import { generateApplicationId } from "@/lib/store/programme-store"; // Unused here, but kept for type completeness if needed
import { useT } from "@/i18n";

export function ApplicationDetailDrawer({
  application,
  onClose,
  onWithdraw,
}: {
  application: Application;
  onClose: () => void;
  onWithdraw: () => void;
}) {
  const t = useT();
  const canWithdraw = !["rejected", "withdrawn", "completed", "batch_allocated"].includes(application.status);
  const DOC_STATUS_KEYS: Record<string, string> = {
    pending: "trainee.applicationDetail.docPending",
    uploaded: "trainee.applicationDetail.docUploaded",
    invalid: "trainee.applicationDetail.docInvalid",
    verified: "trainee.applicationDetail.docVerified",
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-heading text-lg font-bold">{t("trainee.applicationDetail.title")}</h2>
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
            <p className="text-sm font-bold mb-1">{t("trainee.applicationDetail.currentStage")} {application.currentStage}</p>
            {application.correctionNote && <p className="text-xs text-orange-700">{application.correctionNote}</p>}
            {application.rejectionReason && <p className="text-xs text-red-700">{application.rejectionReason}</p>}
            {application.batchAllocation && (
              <div className="mt-2 text-xs text-green-800 space-y-0.5">
                <p><strong>{t("trainee.applicationDetail.batch")}</strong> {application.batchAllocation.batchName}</p>
                <p><strong>{t("trainee.applicationDetail.trainer")}</strong> {application.batchAllocation.trainerName}</p>
                <p><strong>{t("trainee.applicationDetail.schedule")}</strong> {new Date(application.batchAllocation.startDate).toLocaleDateString()} — {application.batchAllocation.time}</p>
                <p><strong>{t("trainee.applicationDetail.venue")}</strong> {application.batchAllocation.room}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground tracking-wider">{t("trainee.applicationDetail.timeline")}</h3>
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
                    })} • {t("trainee.applicationDetail.by")} {event.actor}
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
            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground tracking-wider">{t("trainee.applicationDetail.submittedDetails")}</h3>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              <div className="p-4 grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">{t("trainee.applicationDetail.name")}</p><p className="text-sm font-medium">{application.traineeName}</p></div>
                <div><p className="text-xs text-muted-foreground">{t("trainee.applicationDetail.phone")}</p><p className="text-sm font-medium">{application.personalInfo?.phone}</p></div>
                <div><p className="text-xs text-muted-foreground">{t("trainee.applicationDetail.cooperative")}</p><p className="text-sm font-medium">{application.personalInfo?.cooperativeMembership}</p></div>
                <div><p className="text-xs text-muted-foreground">{t("trainee.applicationDetail.experience")}</p><p className="text-sm font-medium">{application.personalInfo?.experience}</p></div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">{t("trainee.applicationDetail.language")}</p><p className="text-sm font-medium">{application.preferences.preferredLanguage}</p></div>
                <div><p className="text-xs text-muted-foreground">{t("trainee.applicationDetail.batchPreference")}</p><p className="text-sm font-medium">{application.preferences.preferredBatch}</p></div>
                <div><p className="text-xs text-muted-foreground">{t("trainee.applicationDetail.hostel")}</p><p className="text-sm font-medium">{application.preferences.hostelRequired ? t("trainee.applicationDetail.required") : t("trainee.applicationDetail.notRequired")}</p></div>
                <div><p className="text-xs text-muted-foreground">{t("trainee.applicationDetail.meals")}</p><p className="text-sm font-medium">{application.preferences.mealRequired ? t("trainee.applicationDetail.required") : t("trainee.applicationDetail.notRequired")}</p></div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground tracking-wider">{t("trainee.applicationDetail.documents")}</h3>
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
                    {t(DOC_STATUS_KEYS[doc.status] ?? "trainee.applicationDetail.docPending")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border p-5 flex justify-between bg-muted/20">
          {canWithdraw ? (
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onWithdraw}>
              {t("trainee.applicationDetail.withdrawApp")}
            </Button>
          ) : (
            <div />
          )}
          <Button variant="ghost" onClick={onClose}>{t("trainee.applicationDetail.close")}</Button>
        </div>
      </div>
    </>
  );
}
