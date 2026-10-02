"use client";

import { useState } from "react";
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
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hostelService } from "@/lib/hostel/hostel-service";

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

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState(hostelService.getFacilities());

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>Home</span>
            <ChevronRight className="size-3" />
            <Link href="/institution/hostel" className="hover:text-primary">
              Hostel Management
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">Facilities</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Campus Residential Facilities
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Operational status of high-speed Wi-Fi, dining mess, laundry, gym, drinking water, and round-the-clock security.
          </p>
        </div>
      </div>

      {/* FACILITIES GRID (MATCHING IMAGE 4 PANEL 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map((fac) => {
          const Icon = ICON_MAP[fac.icon] || Sparkles;
          const isAvail = fac.status === "Available";

          return (
            <div
              key={fac.id}
              className="p-5 rounded-2xl border bg-card shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{fac.name}</h3>
                      <span className="text-[10px] text-muted-foreground font-mono">{fac.hostelName}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isAvail
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                        : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                    }
                  >
                    {fac.status}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{fac.description}</p>
              </div>

              <div className="pt-3 border-t mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3 text-primary" /> Timings:
                </span>
                <span className="font-semibold text-foreground">{fac.timing}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
