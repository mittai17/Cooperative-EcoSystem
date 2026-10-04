"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  BedDouble,
  CheckCircle2,
  Phone,
  Clock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hostelService } from "@/lib/hostel/hostel-service";
import { DEMO_TRAINEE_RAVINDRA } from "@/lib/hostel/mock-data";
import { useT } from "@/i18n";

export default function TraineeAllocationDetailsPage() {
  const t = useT();
  const trainee = hostelService.getTraineeById("trn-ravindra") || DEMO_TRAINEE_RAVINDRA;
  const [requestChangeSubmitted, setRequestChangeSubmitted] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER (MATCHING IMAGE 4 PANEL 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>{t("trainee.common.home")}</span>
            <ChevronRight className="size-3" />
            <Link href="/trainee/hostel" className="hover:text-primary">
              {t("trainee.hostel.management")}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">{t("trainee.allocation.breadcrumb")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            {t("trainee.allocation.title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t("trainee.allocation.description")}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setRequestChangeSubmitted(true)}
          className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs self-start sm:self-auto"
        >
          + {t("trainee.allocation.requestChange")}
        </Button>
      </div>

      {requestChangeSubmitted && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          {t("trainee.allocation.submitted")}
        </div>
      )}

      {/* CURRENT ALLOCATION CARD (MATCHING IMAGE 4 PANEL 3) */}
      <div className="p-5 rounded-2xl border bg-card shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BedDouble className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">{t("trainee.allocation.current")}</span>
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none">
                {t("trainee.common.checkedIn")}
              </Badge>
            </div>
            <h3 className="font-bold text-base text-foreground mt-0.5 font-heading">
              VAMNICOM Main Hostel
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("trainee.allocation.caption")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 text-xs sm:border-l sm:pl-8">
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("trainee.allocation.checkIn")}</span>
            <span className="font-bold text-foreground">12 Oct 2026</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("trainee.hostel.expectedCheckout")}</span>
            <span className="font-bold text-foreground">25 Oct 2026</span>
          </div>
        </div>
      </div>

      {/* 3 MID CARDS (MY DETAILS, ROOM INFO, ROOMMATES) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* My Details */}
        <div className="md:col-span-4 rounded-2xl border bg-card p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b">{t("trainee.allocation.myDetails")}</h3>
          <div className="flex items-center gap-3 pb-1">
            <div className="size-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
              RP
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">{trainee.fullName}</div>
              <div className="text-[11px] text-muted-foreground">{trainee.traineeCode}</div>
            </div>
          </div>

          <div className="text-xs space-y-2 pt-2 border-t">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.allocation.gender")}:</span>
              <span className="font-semibold text-foreground">{trainee.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.allocation.programme")}:</span>
              <span className="font-semibold text-foreground text-right">{trainee.programme}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.allocation.batch")}:</span>
              <span className="font-bold text-primary">{trainee.batch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.allocation.trainingPeriod")}:</span>
              <span className="font-semibold text-foreground">12 Oct &mdash; 25 Oct 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.allocation.hostelPreference")}:</span>
              <span className="font-semibold text-foreground">{t("trainee.allocation.mainHostel")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.hostel.roomType")}:</span>
              <span className="font-semibold text-foreground">{t("trainee.allocation.fourSharing")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.allocation.specialRequirement")}:</span>
              <span className="font-semibold text-foreground">{t("trainee.allocation.nonAc")}</span>
            </div>
          </div>
        </div>

        {/* Room Information */}
        <div className="md:col-span-4 rounded-2xl border bg-card p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b">{t("trainee.allocation.roomInfo")}</h3>
          <div className="text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.hostel.roomNumber")}:</span>
              <span className="font-mono font-bold text-foreground">A-204</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.hostel.block")}:</span>
              <span className="font-semibold text-foreground">A (Academic Block)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.hostel.floor")}:</span>
              <span className="font-semibold text-foreground">{t("trainee.hostel.floorValue")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.hostel.roomType")}:</span>
              <span className="font-semibold text-foreground">{t("trainee.hostel.roomTypeValue")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.allocation.totalBeds")}:</span>
              <span className="font-semibold text-foreground">4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.allocation.occupiedBeds")}:</span>
              <span className="font-bold text-red-600">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trainee.allocation.availableBeds")}:</span>
              <span className="font-bold text-emerald-600">1</span>
            </div>
            <div className="pt-2 border-t">
              <span className="text-muted-foreground block mb-1">{t("trainee.allocation.facilities")}:</span>
              <span className="text-[11px] font-medium text-foreground">
                {t("trainee.allocation.facilitiesList")}
              </span>
            </div>
          </div>
        </div>

        {/* Roommates */}
        <div className="md:col-span-4 rounded-2xl border bg-card p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b">{t("trainee.hostel.roommates").replace("{count}", "3")}</h3>
          <div className="space-y-3 text-xs">
            {[
              { name: "Amit Gupta", batch: "CLG-01", initials: "AG", bed: "Bed 01" },
              { name: "Vikram Solanki", batch: "PDA-02", initials: "VS", bed: "Bed 03" },
              { name: "Neha Sharma", batch: "DL-01", initials: "NS", bed: "Bed 04" },
            ].map((rm) => (
              <div key={rm.name} className="flex items-center justify-between p-2 rounded-xl bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    {rm.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{rm.name}</div>
                    <div className="text-[10px] text-muted-foreground">{rm.batch} &bull; {rm.bed}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                  <Phone className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STAY TIMELINE (MATCHING IMAGE 4 PANEL 3) */}
      <div className="rounded-2xl border bg-card p-6 shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-foreground pb-2 border-b flex items-center gap-2">
          <Clock className="size-4 text-primary" /> {t("trainee.allocation.stayTimeline")}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center text-xs">
          <div className="space-y-1">
            <div className="size-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <Check className="size-4 stroke-[3]" />
            </div>
            <div className="font-bold text-foreground mt-2">{t("trainee.allocation.requestSubmitted")}</div>
            <div className="text-[11px] text-muted-foreground">08 Oct 2026</div>
          </div>

          <div className="space-y-1">
            <div className="size-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <Check className="size-4 stroke-[3]" />
            </div>
            <div className="font-bold text-foreground mt-2">{t("trainee.allocation.approved")}</div>
            <div className="text-[11px] text-muted-foreground">10 Oct 2026</div>
          </div>

          <div className="space-y-1">
            <div className="size-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <Check className="size-4 stroke-[3]" />
            </div>
            <div className="font-bold text-foreground mt-2">{t("trainee.allocation.roomAllocated")}</div>
            <div className="text-[11px] text-muted-foreground">11 Oct 2026</div>
          </div>

          <div className="space-y-1">
            <div className="size-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <Check className="size-4 stroke-[3]" />
            </div>
            <div className="font-bold text-emerald-600 mt-2">{t("trainee.common.checkedIn")}</div>
            <div className="text-[11px] text-muted-foreground">12 Oct 2026</div>
          </div>

          <div className="space-y-1 opacity-60">
            <div className="size-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              5
            </div>
            <div className="font-bold text-foreground mt-2">{t("trainee.hostel.expectedCheckout")}</div>
            <div className="text-[11px] text-muted-foreground">25 Oct 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}
