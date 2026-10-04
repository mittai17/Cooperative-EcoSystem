"use client";

import Link from "next/link";
import { ChevronRight, Bell, Pin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { hostelService } from "@/lib/hostel/hostel-service";
import { useT } from "@/i18n";

export default function TraineeNoticesPage() {
  const t = useT();
  const notices = hostelService.getNotices();

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
          <span>{t("trainee.common.home")}</span>
          <ChevronRight className="size-3" />
          <Link href="/trainee/hostel" className="hover:text-primary">
            {t("trainee.hostel.management")}
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-semibold">{t("trainee.hostelNotices.breadcrumb")}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
          {t("trainee.hostelNotices.title")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {t("trainee.hostelNotices.description")}
        </p>
      </div>

      {/* NOTICES LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notices.map((n) => (
          <div
            key={n.id}
            className={`p-5 rounded-2xl border bg-card shadow-2xs flex flex-col justify-between ${
              n.isPinned ? "border-primary/40 bg-rose-50/20" : ""
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {n.category}
                  </Badge>
                  {n.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                      <Pin className="size-3" /> {t("trainee.hostelNotices.pinned")}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" /> {n.publishDate}
                </span>
              </div>

              <h3 className="font-bold text-base text-foreground mt-1">{n.title}</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{n.description}</p>
            </div>

            <div className="pt-4 border-t mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("trainee.hostelNotices.audience")}: {n.audience}</span>
              <Badge
                variant="outline"
                className={n.priority === "High" ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground"}
              >
                {t("trainee.hostelNotices.priority").replace("{level}", n.priority)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
