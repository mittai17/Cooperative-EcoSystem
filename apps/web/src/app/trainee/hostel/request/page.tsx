"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Check,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Users,
  Utensils,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hostelService } from "@/lib/hostel/hostel-service";
import type { RoomType } from "@/lib/hostel/types";
import { useT } from "@/i18n";

export default function TraineeHostelRequestPage() {
  const t = useT();
  const roomLabels: Record<string, string> = {
    "Double Sharing": t("trainee.hostelRequest.roomDouble"),
    "4 Sharing": t("trainee.hostelRequest.roomFour"),
    "6 Sharing": t("trainee.hostelRequest.roomSix"),
  };
  const [step, setStep] = useState(1);
  const [programme, setProgramme] = useState("PACS Digital Accounting");
  const [batch, setBatch] = useState("PDA-02");
  const [startDate, setStartDate] = useState("2026-10-12");
  const [endDate, setEndDate] = useState("2026-10-25");
  const [hostelPref, setHostelPref] = useState("VAMNICOM Main Hostel");
  const [roomPref, setRoomPref] = useState<RoomType>("4 Sharing");
  const [acPref] = useState("no");
  const [specialReq, setSpecialReq] = useState("Non-AC, Ground or 2nd floor (if possible)");
  const [reason, setReason] = useState("Mandatory residential module enrollment under state cooperative training quota.");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    hostelService.submitHostelRequest({
      traineeId: "trn-ravindra",
      requestedHostel: hostelPref,
      roomPreference: roomPref,
      acPreference: acPref === "yes",
      specialRequirement: specialReq,
      reason,
    });
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER (MATCHING IMAGE 4 PANEL 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>{t("trainee.common.home")}</span>
            <ChevronRight className="size-3" />
            <Link href="/trainee/hostel" className="hover:text-primary">
              {t("trainee.hostel.management")}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">{t("trainee.hostelRequest.breadcrumb")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            {t("trainee.hostelRequest.breadcrumb")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t("trainee.hostelRequest.description")}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setStep(1);
            setSubmitted(false);
          }}
          className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs self-start sm:self-auto"
        >
          {t("trainee.hostelRequest.newRequest")}
        </Button>
      </div>

      {submitted ? (
        <div className="p-8 rounded-2xl border bg-emerald-50/50 border-emerald-200 text-center max-w-xl mx-auto space-y-4">
          <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-10" />
          </div>
          <h2 className="text-xl font-bold text-emerald-950 font-heading">
            {t("trainee.hostelRequest.submittedTitle")}
          </h2>
          <p className="text-xs text-emerald-800 leading-relaxed">
            {t("trainee.hostelRequest.submittedBefore")} <span className="font-mono font-bold">HR-1042</span>{t("trainee.hostelRequest.submittedAfter")}
          </p>
          <div className="pt-2">
            <Button
              render={<Link href="/trainee/hostel" />}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              {t("trainee.hostelRequest.returnHostel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-6 shadow-2xs space-y-6">
          {/* STEPPING PROGRESS BAR (MATCHING IMAGE 4 PANEL 2) */}
          <div className="flex items-center justify-between border-b pb-4 overflow-x-auto text-xs font-semibold">
            {[
              { s: 1, label: t("trainee.hostelRequest.stepTraining") },
              { s: 2, label: t("trainee.hostelRequest.stepDates") },
              { s: 3, label: t("trainee.hostelRequest.stepHostel") },
              { s: 4, label: t("trainee.hostelRequest.stepRoom") },
              { s: 5, label: t("trainee.hostelRequest.stepSpecial") },
              { s: 6, label: t("trainee.hostelRequest.stepReview") },
            ].map(({ s, label }) => (
              <div
                key={s}
                className={`flex items-center gap-1.5 shrink-0 px-2 ${
                  step === s ? "text-primary font-bold" : step > s ? "text-muted-foreground" : "text-muted-foreground/50"
                }`}
              >
                <span
                  className={`size-6 rounded-full flex items-center justify-center text-xs ${
                    step === s
                      ? "bg-primary text-white font-bold"
                      : step > s
                      ? "bg-emerald-100 text-emerald-700 font-bold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="size-3.5 stroke-[3]" /> : s}
                </span>
                <span className="hidden md:inline">{label}</span>
              </div>
            ))}
          </div>

          {/* MAIN FORM GRID WITH RIGHT BANNER (MATCHING IMAGE 4 PANEL 2) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left: Wizard Form */}
            <div className="md:col-span-7 space-y-5">
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-foreground font-heading">
                    1. {t("trainee.hostelRequest.title1")}
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("trainee.allocation.programme")}</Label>
                      <Select value={programme} onValueChange={(v) => v && setProgramme(v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder={t("trainee.allocation.programme")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PACS Digital Accounting">PACS Digital Accounting</SelectItem>
                          <SelectItem value="Cooperative Management Fundamentals">Cooperative Management Fundamentals</SelectItem>
                          <SelectItem value="Dairy Cooperative Operations">Dairy Cooperative Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("trainee.allocation.batch")}</Label>
                      <Select value={batch} onValueChange={(v) => v && setBatch(v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder={t("trainee.allocation.batch")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PDA-02">PDA-02</SelectItem>
                          <SelectItem value="PDA-01">PDA-01</SelectItem>
                          <SelectItem value="CMF-01">CMF-01</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("trainee.hostelRequest.trainingStartDate")}</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("trainee.hostelRequest.trainingEndDate")}</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-foreground font-heading">
                    2. {t("trainee.hostelRequest.title2")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("trainee.hostelRequest.datesHint")}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("trainee.hostelRequest.requestedCheckIn")}</Label>
                      <Input type="date" defaultValue="2026-10-12" className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("trainee.hostelRequest.requestedCheckOut")}</Label>
                      <Input type="date" defaultValue="2026-10-25" className="h-9 text-xs" />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-foreground font-heading">
                    3. {t("trainee.hostelRequest.title3")}
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { name: "VAMNICOM Main Hostel", desc: t("trainee.hostelRequest.hostelMainDesc") },
                      { name: "Training Residential Hostel", desc: t("trainee.hostelRequest.hostelTrainingDesc") },
                      { name: "Guest & Faculty Hostel", desc: t("trainee.hostelRequest.hostelGuestDesc") },
                    ].map((h) => (
                      <div
                        key={h.name}
                        onClick={() => setHostelPref(h.name)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          hostelPref === h.name ? "bg-rose-50 border-primary ring-2 ring-primary/20" : "bg-card"
                        }`}
                      >
                        <div className="font-bold text-foreground text-sm">{h.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{h.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-foreground font-heading">
                    4. {t("trainee.hostelRequest.title4")}
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {["Double Sharing", "4 Sharing", "6 Sharing"].map((type) => (
                      <div
                        key={type}
                        onClick={() => setRoomPref(type as RoomType)}
                        className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all ${
                          roomPref === type ? "bg-rose-50 border-primary ring-2 ring-primary/20 font-bold text-primary" : "bg-card"
                        }`}
                      >
                        {roomLabels[type]}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-foreground font-heading">
                    5. {t("trainee.hostelRequest.title5")}
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("trainee.hostelRequest.specialHint")}</Label>
                      <Input
                        value={specialReq}
                        onChange={(e) => setSpecialReq(e.target.value)}
                        placeholder={t("trainee.hostelRequest.specialPlaceholder")}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("trainee.hostelRequest.reasonLabel")}</Label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="h-20 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-foreground font-heading">
                    6. {t("trainee.hostelRequest.title6")}
                  </h3>
                  <div className="p-4 rounded-xl border bg-muted/20 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("trainee.hostelRequest.reviewProgramme")}:</span>
                      <span className="font-semibold text-foreground">{programme} ({batch})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("trainee.hostelRequest.requestedStay")}:</span>
                      <span className="font-semibold text-foreground">{t("trainee.hostelRequest.stayRange").replace("{start}", startDate).replace("{end}", endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("trainee.hostelRequest.hostel")}:</span>
                      <span className="font-semibold text-foreground">{hostelPref}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("trainee.hostel.roomType")}:</span>
                      <span className="font-semibold text-foreground">{roomPref}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("trainee.allocation.specialRequirement")}:</span>
                      <span className="font-semibold text-foreground">{specialReq}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* FOOTER CONTROLS */}
              <div className="flex items-center justify-between pt-4 border-t">
                {step > 1 ? (
                  <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                    {t("trainee.common.back")}
                  </Button>
                ) : (
                  <div />
                )}
                {step < 6 ? (
                  <Button
                    size="sm"
                    onClick={() => setStep(step + 1)}
                    className="bg-primary hover:bg-primary/90 text-white font-bold"
                  >
                    {t("trainee.common.next")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {t("trainee.hostelRequest.submit")}
                  </Button>
                )}
              </div>
            </div>

            {/* Right: Why Hostel Accommodation Banner (MATCHING IMAGE 4 PANEL 2) */}
            <div className="md:col-span-5 rounded-2xl border bg-muted/15 p-5 space-y-4">
              <div className="h-36 rounded-xl overflow-hidden border">
                <Image
                  src="/vamnicom-campus.jpg"
                  alt={t("trainee.hostelRequest.imageAlt")}
                  width={640}
                  height={288}
                  className="size-full object-cover"
                />
              </div>

              <div>
                <h4 className="font-bold text-sm text-foreground font-heading">
                  {t("trainee.hostelRequest.whyTitle")}
                </h4>
                <div className="space-y-2.5 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                    <span>{t("trainee.hostelRequest.why1")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-primary shrink-0" />
                    <span>{t("trainee.hostelRequest.why2")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Utensils className="size-4 text-amber-600 shrink-0" />
                    <span>{t("trainee.hostelRequest.why3")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-blue-600 shrink-0" />
                    <span>{t("trainee.hostelRequest.why4")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-purple-600 shrink-0" />
                    <span>{t("trainee.hostelRequest.why5")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
