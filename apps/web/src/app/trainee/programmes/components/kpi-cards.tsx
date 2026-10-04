"use client";

import { GraduationCap, ClipboardList, Clock, CheckCircle2, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

interface KPICardsProps {
  available: number;
  myApplications: number;
  pendingApproval: number;
  approved: number;
  upcomingExams: number;
  onSectionChange: (section: "programmes" | "applications" | "nominations" | "exams") => void;
  activeSection: string;
}

export function KPICards({
  available,
  myApplications,
  pendingApproval,
  approved,
  upcomingExams,
  onSectionChange,
  activeSection,
}: KPICardsProps) {
  const t = useT();
  const cards = [
    {
      label: t("trainee.programmes.kpiAvailable"),
      value: available,
      icon: GraduationCap,
      tint: "bg-blue-50 text-blue-600",
      border: "border-blue-100",
      section: "programmes" as const,
      sub: t("trainee.programmes.kpiAvailableSub"),
    },
    {
      label: t("trainee.programmes.kpiMyApps"),
      value: myApplications,
      icon: ClipboardList,
      tint: "bg-violet-50 text-violet-600",
      border: "border-violet-100",
      section: "applications" as const,
      sub: t("trainee.programmes.kpiMyAppsSub"),
    },
    {
      label: t("trainee.programmes.kpiPending"),
      value: pendingApproval,
      icon: Clock,
      tint: "bg-amber-50 text-amber-600",
      border: "border-amber-100",
      section: "applications" as const,
      sub: t("trainee.programmes.kpiPendingSub"),
    },
    {
      label: t("trainee.programmes.kpiApproved"),
      value: approved,
      icon: CheckCircle2,
      tint: "bg-green-50 text-green-600",
      border: "border-green-100",
      section: "applications" as const,
      sub: t("trainee.programmes.kpiApprovedSub"),
    },
    {
      label: t("trainee.programmes.kpiExams"),
      value: upcomingExams,
      icon: Award,
      tint: "bg-red-50 text-primary",
      border: "border-red-100",
      section: "exams" as const,
      sub: t("trainee.programmes.kpiExamsSub"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeSection === card.section;
        return (
          <button
            key={card.label}
            onClick={() => onSectionChange(card.section)}
            className={cn(
              "group text-left rounded-2xl border bg-card p-4 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5",
              isActive ? "ring-2 ring-primary/40 border-primary/30" : card.border
            )}
          >
            <div className={cn("inline-flex size-10 items-center justify-center rounded-xl mb-3 transition-colors", card.tint)}>
              <Icon className="size-5" strokeWidth={1.9} />
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm font-medium text-foreground leading-tight">{card.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
          </button>
        );
      })}
    </div>
  );
}
