"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BedDouble,
  ChevronRight,
  Wifi,
  BookOpen,
  Bath,
  DoorClosed,
  Phone,
  Mail,
  Clock,
  Wrench,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hostelService } from "@/lib/hostel/hostel-service";
import { DEMO_TRAINEE_RAVINDRA } from "@/lib/hostel/mock-data";
import { ReportIssueModal } from "@/components/hostel/report-issue-modal";
import { useT } from "@/i18n";

export default function TraineeMyHostelPage() {
  const t = useT();
  const [trainee] = useState(
    hostelService.getTraineeById("trn-ravindra") || DEMO_TRAINEE_RAVINDRA
  );
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER (MATCHING IMAGE 4 PANEL 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>{t("trainee.common.home")}</span>
            <ChevronRight className="size-3" />
            <Link href="/trainee/hostel" className="hover:text-primary">
              {t("trainee.hostel.management")}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">{t("trainee.hostel.myHostel")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            {t("trainee.hostel.myHostel")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t("trainee.hostel.myHostelDesc")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIssueModalOpen(true)}
            className="text-xs font-semibold"
          >
            <Wrench className="size-3.5 mr-1 text-primary" /> {t("trainee.hostel.reportIssue")}
          </Button>
          <Button
            render={<Link href="/trainee/hostel/request" />}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs"
          >
            <FileText className="size-3.5 mr-1" /> {t("trainee.hostel.requestHostel")}
          </Button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-4 text-emerald-600" />
          {toastMsg}
        </div>
      )}

      {/* TOP STATUS CARD: HOSTEL ALLOCATED (MATCHING IMAGE 4 PANEL 1) */}
      <div className="p-4 sm:p-5 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <BedDouble className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-emerald-950 dark:text-emerald-200 font-heading">
                {t("trainee.hostel.allocated")}
              </h3>
              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                {trainee.hostelStatus}
              </Badge>
            </div>
            <p className="text-xs text-emerald-800/80 mt-0.5">
              {t("trainee.hostel.allocatedDesc")}
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:pl-6 border-emerald-200">
          <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs py-1 px-3">
            {t("trainee.common.checkedIn")}
          </Badge>
          <div className="text-[11px] text-muted-foreground mt-1">{t("trainee.hostel.since").replace("{date}", "12 Oct 2026")}</div>
        </div>
      </div>

      {/* ROOM DETAILS & PHOTO (MATCHING IMAGE 4 PANEL 1) */}
      <div className="rounded-2xl border bg-card p-5 shadow-2xs">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-3 border-b">
          <DoorClosed className="size-4 text-primary" /> {t("trainee.hostel.roomDetails")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
          {/* Left specs */}
          <div className="md:col-span-7 grid grid-cols-2 gap-y-3 text-xs">
            <div>
              <span className="text-muted-foreground block">{t("trainee.hostel.hostelName")}</span>
              <span className="font-bold text-foreground text-sm">
                {trainee.hostelName || "VAMNICOM Main Hostel"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t("trainee.hostel.block")}</span>
              <span className="font-semibold text-foreground">
                {trainee.blockName || "A (Academic Block)"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t("trainee.hostel.roomNumber")}</span>
              <span className="font-mono font-bold text-base text-primary">
                {trainee.roomNumber || "A-204"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t("trainee.hostel.bedNumber")}</span>
              <span className="font-semibold text-foreground">
                {trainee.bedNumber || "02 (of 4)"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t("trainee.hostel.roomType")}</span>
              <span className="font-semibold text-foreground">{t("trainee.hostel.roomTypeValue")}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t("trainee.hostel.floor")}</span>
              <span className="font-semibold text-foreground">{t("trainee.hostel.floorValue")}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t("trainee.hostel.checkInDate")}</span>
              <span className="font-semibold text-foreground">
                {trainee.checkInDate || "12 Oct 2026"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t("trainee.hostel.expectedCheckout")}</span>
              <span className="font-semibold text-foreground">
                {trainee.expectedCheckout || "25 Oct 2026"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t("trainee.common.status")}</span>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                {trainee.checkInStatus || t("trainee.common.checkedIn")}
              </Badge>
            </div>
          </div>

          {/* Right photo */}
          <div className="md:col-span-5 rounded-xl overflow-hidden border relative h-48 sm:h-auto">
            <Image
              src="/vamnicom-campus.jpg"
              alt={t("trainee.hostel.roomPhotoAlt")}
              width={640}
              height={360}
              className="size-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2.5 py-1 rounded-md text-[11px] text-white font-medium">
              {t("trainee.hostel.roomCaption")}
            </div>
          </div>
        </div>
      </div>

      {/* 3 BOTTOM CARDS (MATCHING IMAGE 4 PANEL 1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Roommates */}
        <div className="rounded-2xl border bg-card p-4.5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b">
            {t("trainee.hostel.roommates").replace("{count}", "3")}
          </h3>
          <div className="space-y-3 text-xs">
            {[
              { name: "Amit Gupta", batch: "CLG-01", initials: "AG", bed: "Bed 01" },
              { name: "Vikram Solanki", batch: "PDA-02", initials: "VS", bed: "Bed 03" },
              { name: "Neha Sharma", batch: "DL-01", initials: "NS", bed: "Bed 04" },
            ].map((rm) => (
              <div key={rm.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    {rm.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{rm.name}</div>
                    <div className="text-[10px] text-muted-foreground">{rm.batch} &bull; {rm.bed}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-primary">
                  <Phone className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Warden Information */}
        <div className="rounded-2xl border bg-card p-4.5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b">
            {t("trainee.hostel.wardenInfo")}
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="font-bold text-sm text-foreground">Mr. S. Deshmukh</div>
              <div className="text-[11px] text-muted-foreground">{t("trainee.hostel.chiefWarden")}</div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-3.5 text-primary" />
                <span className="text-foreground font-medium">+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-3.5 text-primary" />
                <span className="text-foreground font-medium">warden.main@vamnicom.org</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5 text-primary" />
                <span className="text-emerald-600 font-semibold">{t("trainee.hostel.wardenAvailability")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Room Facilities */}
        <div className="rounded-2xl border bg-card p-4.5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b">
            {t("trainee.hostel.roomFacilities")}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-muted/20 border flex items-center gap-2">
              <Wifi className="size-4 text-primary" />
              <div>
                <div className="font-semibold text-foreground text-[11px]">Wi-Fi</div>
                <div className="text-[9px] text-muted-foreground">{t("trainee.common.available")}</div>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-muted/20 border flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <div>
                <div className="font-semibold text-foreground text-[11px]">{t("trainee.hostel.facStudyTable")}</div>
                <div className="text-[9px] text-muted-foreground">{t("trainee.hostel.facSets")}</div>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-muted/20 border flex items-center gap-2">
              <Bath className="size-4 text-primary" />
              <div>
                <div className="font-semibold text-foreground text-[11px]">{t("trainee.hostel.facAttachedBath")}</div>
                <div className="text-[9px] text-muted-foreground">{t("trainee.hostel.facYes")}</div>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-muted/20 border flex items-center gap-2">
              <DoorClosed className="size-4 text-primary" />
              <div>
                <div className="font-semibold text-foreground text-[11px]">{t("trainee.hostel.facWardrobe")}</div>
                <div className="text-[9px] text-muted-foreground">{t("trainee.hostel.facLockable")}</div>
              </div>
            </div>
          </div>
          <div className="pt-2 flex justify-between gap-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => showToast(t("trainee.hostel.changeForwarded"))}
              className="text-xs flex-1"
            >
              {t("trainee.hostel.requestChange")}
            </Button>
            <Button render={<Link href="/trainee/hostel/rules" />} size="sm" variant="ghost" className="text-xs flex-1 text-primary">{t("trainee.hostel.viewRules")}</Button>
          </div>
        </div>
      </div>

      <ReportIssueModal
        open={issueModalOpen}
        onOpenChange={setIssueModalOpen}
        defaultLocation="Room A-204"
        defaultReporter={trainee.fullName}
        reporterRole={t("trainee.common.roleTrainee")}
        onSuccess={() => showToast(t("trainee.hostel.maintenanceSubmitted"))}
      />
    </div>
  );
}
