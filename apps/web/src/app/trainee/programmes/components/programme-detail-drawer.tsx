"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle, AlertCircle, ChevronRight, Clock, MapPin, Users, Star, Calendar, Building2, BookOpen, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Programme } from "@/types/programme";
import { checkEligibility, DEMO_TRAINEE_PROFILE } from "@/lib/services/eligibility-service";
import { useApplications } from "@/lib/store/programme-store";
import { mockTrainers, mockInstitutions } from "@/lib/mock-data/programmes-data";
import { useT } from "@/i18n";
import { optionLabel } from "../option-labels";

const TAB_KEYS: Record<"overview" | "curriculum" | "eligibility" | "institution" | "faq", string> = {
  overview: "trainee.programmeDetail.tabOverview",
  curriculum: "trainee.programmeDetail.tabCurriculum",
  eligibility: "trainee.programmeDetail.tabEligibility",
  institution: "trainee.programmeDetail.tabInstitution",
  faq: "trainee.programmeDetail.tabFaq",
};

interface ProgrammeDetailDrawerProps {
  programme: Programme;
  onClose: () => void;
  onApply: (p: Programme) => void;
}

export function ProgrammeDetailDrawer({ programme, onClose, onApply }: ProgrammeDetailDrawerProps) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "eligibility" | "institution" | "faq">("overview");
  const { getByTrainee } = useApplications();
  const myApps = getByTrainee("trainee-ravindra");
  const existing = myApps.find((a) => a.programmeId === programme.id && a.status !== "withdrawn");

  const eligibility = checkEligibility(programme.eligibilityRules, DEMO_TRAINEE_PROFILE);
  const institution = mockInstitutions.find((i) => i.id === programme.institutionId);
  const trainers = programme.trainerIds.map((id) => mockTrainers.find((t) => t.id === id)).filter(Boolean);
  const isFull = programme.availableSeats === 0;
  const deadline = new Date(programme.registrationDeadline);
  const isPastDeadline = deadline < new Date();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <Badge variant="secondary" className="text-xs">{optionLabel(t, programme.level)}</Badge>
              <Badge variant="secondary" className="text-xs">{optionLabel(t, programme.mode)}</Badge>
              {programme.isFree && <Badge className="bg-green-500 text-white text-xs">{t("trainee.programmes.freeBadge")}</Badge>}
            </div>
            <h2 className="font-heading text-lg font-bold text-foreground leading-snug">{programme.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{programme.institution}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 mt-1 size-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border px-5 pt-3 pb-0">
          <div className="flex gap-0 overflow-x-auto">
            {(["overview", "curriculum", "eligibility", "institution", "faq"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "capitalize px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {t(TAB_KEYS[tab])}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* === OVERVIEW === */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Key details grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: t("trainee.programmeDetail.duration"), value: `${programme.duration} ${programme.durationUnit}`, icon: Clock },
                  { label: t("trainee.programmeDetail.startDate"), value: new Date(programme.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), icon: Calendar },
                  { label: t("trainee.programmeDetail.seatsLeft"), value: programme.availableSeats === 0 ? t("trainee.programmeDetail.full") : `${programme.availableSeats} / ${programme.totalSeats}`, icon: Users },
                  { label: t("trainee.programmeDetail.certificate"), value: programme.certificateType, icon: Award },
                ].map((d) => {
                  const Icon = d.icon;
                  return (
                    <div key={d.label} className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Icon className="size-3" /> {d.label}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{d.value}</p>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{programme.fullDescription}</p>

              {/* Skills */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("trainee.programmeDetail.skillsBuild")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {programme.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>

              {/* Learning outcomes */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("trainee.programmeDetail.learningOutcomes")}</p>
                <ul className="space-y-1.5">
                  {programme.learningOutcomes.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trainers */}
              {trainers.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("trainee.programmeDetail.trainers")}</p>
                  <div className="space-y-2.5">
                    {trainers.map((trainer) => trainer && (
                      <div key={trainer.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {trainer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{trainer.name}</p>
                          <p className="text-xs text-muted-foreground">{trainer.title}</p>
                          <p className="text-xs text-muted-foreground">{trainer.experience} {t("trainee.programmeDetail.experience")} • ★ {trainer.rating}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("trainee.programmeDetail.facilities")}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: t("trainee.programmeDetail.hostel"), available: programme.hostelAvailable },
                    { label: t("trainee.programmeDetail.meals"), available: programme.mealAvailable },
                    { label: t("trainee.programmeDetail.transport"), available: programme.transportAvailable },
                  ].map((f) => (
                    <div key={f.label} className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                      f.available ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"
                    )}>
                      {f.available ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                      {f.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Required docs */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("trainee.programmeDetail.documentsRequired")}</p>
                <div className="space-y-1">
                  {programme.documentsRequired.map((d) => (
                    <div key={d} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === CURRICULUM === */}
          {activeTab === "curriculum" && (
            <div className="space-y-3">
              {programme.curriculum.map((mod) => (
                <div key={mod.week} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
                    <span className="text-sm font-semibold">{t("trainee.programmeDetail.week").replace("{n}", String(mod.week))} {mod.title}</span>
                    <span className="text-xs text-muted-foreground">{mod.hours} {t("trainee.programmeDetail.hours")}</span>
                  </div>
                  <ul className="p-4 space-y-1.5">
                    {mod.topics.map((topic) => (
                      <li key={topic} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-primary shrink-0" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* === ELIGIBILITY === */}
          {activeTab === "eligibility" && (
            <div className="space-y-4">
              <div className={cn(
                "flex items-center gap-3 rounded-xl border p-4",
                eligibility.overall === "eligible" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              )}>
                {eligibility.overall === "eligible" ? (
                  <CheckCircle2 className="size-6 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="size-6 text-red-600 shrink-0" />
                )}
                <div>
                  <p className={cn("font-semibold text-sm", eligibility.overall === "eligible" ? "text-green-700" : "text-red-700")}>
                    {eligibility.overall === "eligible" ? t("trainee.programmeDetail.eligibleToApply") : t("trainee.programmeDetail.notEligible")}
                  </p>
                  <p className="text-xs mt-0.5 text-muted-foreground">{eligibility.summary}</p>
                </div>
              </div>

              <div className="space-y-2">
                {eligibility.details.map((d) => (
                  <div key={d.ruleId} className={cn(
                    "flex items-start gap-3 rounded-lg border p-3",
                    d.met ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"
                  )}>
                    {d.met ? (
                      <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{d.label}</p>
                      <p className="text-xs text-muted-foreground">{d.description}</p>
                      {!d.met && d.reason && (
                        <p className="text-xs text-red-600 mt-0.5">{d.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">{t("trainee.programmeDetail.profileTitle").replace("{name}", "Ravindra Suresh Patil")}</p>
                <p>{t("trainee.programmeDetail.education")} {DEMO_TRAINEE_PROFILE.education} • {t("trainee.programmeDetail.age")} {DEMO_TRAINEE_PROFILE.age} • {t("trainee.programmeDetail.experienceLabel")} {DEMO_TRAINEE_PROFILE.experience} {t("trainee.programmeDetail.years")}</p>
                <p>{t("trainee.programmeDetail.cooperative")} {DEMO_TRAINEE_PROFILE.cooperativeMembership}</p>
              </div>
            </div>
          )}

          {/* === INSTITUTION === */}
          {activeTab === "institution" && institution && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{institution.name}</p>
                    <p className="text-xs text-muted-foreground">{institution.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">{t("trainee.programmeDetail.state")}</p><p className="font-medium">{institution.state}</p></div>
                  <div><p className="text-xs text-muted-foreground">{t("trainee.programmeDetail.district")}</p><p className="font-medium">{institution.district}</p></div>
                  <div><p className="text-xs text-muted-foreground">{t("trainee.programmeDetail.accreditation")}</p><p className="font-medium">{institution.accreditation}</p></div>
                  <div><p className="text-xs text-muted-foreground">{t("trainee.programmeDetail.website")}</p><p className="font-medium text-primary">{institution.website}</p></div>
                </div>
                <div className="mt-3 pt-3 border-t border-border text-sm">
                  <p className="text-xs text-muted-foreground mb-1">{t("trainee.programmeDetail.address")}</p>
                  <p>{institution.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* === FAQ === */}
          {activeTab === "faq" && (
            <div className="space-y-3">
              {[
                { q: t("trainee.programmeDetail.faqQ1"), a: t("trainee.programmeDetail.faqA1") },
                { q: t("trainee.programmeDetail.faqQ2"), a: programme.hostelAvailable ? t("trainee.programmeDetail.faqA2Yes") : t("trainee.programmeDetail.faqA2No") },
                { q: t("trainee.programmeDetail.faqQ3"), a: t("trainee.programmeDetail.faqA3") },
                { q: t("trainee.programmeDetail.faqQ4"), a: t("trainee.programmeDetail.faqA4").replace("{certificate}", programme.certificateType === "No Certificate" ? t("trainee.programmeDetail.faqCertAck") : t("trainee.programmeDetail.faqCertNcct").replace("{type}", programme.certificateType.toLowerCase())) },
                { q: t("trainee.programmeDetail.faqQ5"), a: t("trainee.programmeDetail.faqA5") },
              ].map((faq, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-semibold text-sm text-foreground mb-1.5">{faq.q}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-border p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {programme.isFree ? (
              <p className="text-sm font-semibold text-green-600">{t("trainee.programmes.freeProgramme")}</p>
            ) : (
              <p className="text-sm font-semibold text-foreground">₹{programme.fee.toLocaleString("en-IN")}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("trainee.programmeDetail.deadline")}: {new Date(programme.registrationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
            </p>
          </div>
          {existing ? (
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={onClose}>
              <CheckCircle2 className="size-4 mr-1.5" /> {t("trainee.programmeDetail.applicationSubmitted")}
            </Button>
          ) : isFull || isPastDeadline ? (
            <Button disabled>{t("trainee.programmes.registrationClosed")}</Button>
          ) : eligibility.overall === "not_eligible" ? (
            <Button disabled variant="outline">{t("trainee.programmeDetail.notEligibleToApply")}</Button>
          ) : (
            <Button onClick={() => onApply(programme)}>
              {t("trainee.programmes.applyNow")} <ChevronRight className="size-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
