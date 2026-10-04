"use client";

import Link from "next/link";
import { ChevronRight, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useT } from "@/i18n";

export default function TraineeRulesPage() {
  const t = useT();
  const rules = [
    { category: t("trainee.hostelRules.cat1"), points: [t("trainee.hostelRules.cat1p1"), t("trainee.hostelRules.cat1p2")] },
    { category: t("trainee.hostelRules.cat2"), points: [t("trainee.hostelRules.cat2p1"), t("trainee.hostelRules.cat2p2")] },
    { category: t("trainee.hostelRules.cat3"), points: [t("trainee.hostelRules.cat3p1"), t("trainee.hostelRules.cat3p2")] },
    { category: t("trainee.hostelRules.cat4"), points: [t("trainee.hostelRules.cat4p1"), t("trainee.hostelRules.cat4p2")] },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
          <span>{t("trainee.common.home")}</span>
          <ChevronRight className="size-3" />
          <Link href="/trainee/hostel" className="hover:text-primary">
            {t("trainee.hostel.management")}
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-semibold">{t("trainee.hostelRules.breadcrumb")}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
          {t("trainee.hostelRules.title")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {t("trainee.hostelRules.description")}
        </p>
      </div>

      <div className="space-y-4">
        {rules.map((r) => (
          <div key={r.category} className="p-5 rounded-2xl border bg-card shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b">
              <ShieldAlert className="size-4 text-primary" /> {r.category}
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-5 leading-relaxed">
              {r.points.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
