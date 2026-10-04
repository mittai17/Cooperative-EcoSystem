"use client";

import Link from "next/link";
import {
  Sparkles,
  ChevronRight,
  Wifi,
  Utensils,
  Shirt,
  Tv,
  BookOpen,
  Droplets,
  Sun,
  Shield,
  Camera,
  Dumbbell,
  ShieldAlert,
  Bell,
  Clock,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hostelService } from "@/lib/hostel/hostel-service";
import { useT } from "@/i18n";

const ICON_MAP: Record<string, any> = {
  Wifi,
  Utensils,
  Shirt,
  Tv,
  BookOpen,
  Droplets,
  Sun,
  Shield,
  Camera,
  Dumbbell,
};

export default function TraineeFacilitiesPage() {
  const t = useT();
  const facilities = hostelService.getFacilities();
  const notices = hostelService.getNotices();

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER (MATCHING IMAGE 4 PANEL 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>{t("trainee.common.home")}</span>
            <ChevronRight className="size-3" />
            <Link href="/trainee/hostel" className="hover:text-primary">
              {t("trainee.hostel.management")}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">{t("trainee.hostelFacilities.breadcrumb")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            {t("trainee.hostelFacilities.title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t("trainee.hostelFacilities.description")}
          </p>
        </div>

        <Button
          render={<Link href="/trainee/hostel/rules" />}
          size="sm"
          variant="outline"
          className="text-xs font-semibold self-start sm:self-auto"
        >
          <ShieldAlert className="size-3.5 mr-1 text-primary" /> {t("trainee.hostelRules.breadcrumb")}
        </Button>
      </div>

      {/* HOSTEL CAMPUS BANNER (MATCHING IMAGE 4 PANEL 4) */}
      <div className="p-4 sm:p-5 rounded-2xl border bg-card shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl overflow-hidden border shrink-0">
            <img src="/vamnicom-campus.jpg" alt="VAMNICOM" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground font-heading">
              VAMNICOM Main Hostel
            </h3>
            <p className="text-xs text-muted-foreground">Pune, Maharashtra</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>{t("trainee.hostel.warden").replace("{name}", "Mr. S. Deshmukh")}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <Phone className="size-3" /> +91 98765 43210
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AVAILABLE FACILITIES (MATCHING IMAGE 4 PANEL 4) */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-foreground font-heading flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> {t("trainee.hostelFacilities.availableHeading")}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {facilities.map((fac) => {
            const Icon = ICON_MAP[fac.icon] || Sparkles;
            const isAvail = fac.status === "Available";

            return (
              <div
                key={fac.id}
                className="p-3.5 rounded-xl border bg-card shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="size-4" />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isAvail
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0"
                        : "bg-amber-50 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0"
                    }
                  >
                    {fac.status === "Available" ? t("trainee.common.available") : fac.status}
                  </Badge>
                </div>

                <div className="mt-3">
                  <div className="font-bold text-foreground text-xs">{fac.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{fac.timing}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* IMPORTANT NOTICES (MATCHING IMAGE 4 PANEL 4) */}
      <div className="rounded-2xl border bg-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 font-heading">
            <Bell className="size-4 text-primary" /> {t("trainee.hostelFacilities.importantNotices")}
          </h3>
          <Link href="/trainee/hostel/notices" className="text-xs text-primary font-semibold hover:underline">
            {t("trainee.common.viewAll")}
          </Link>
        </div>

        <div className="divide-y text-xs">
          {notices.map((n) => (
            <div key={n.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{n.title}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {n.category}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{n.description}</p>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">{n.publishDate}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
