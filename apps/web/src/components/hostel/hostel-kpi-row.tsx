"use client";

import {
  Bed,
  Users,
  BedDouble,
  Lock,
  FileText,
  Wrench,
  LogIn,
  LogOut,
} from "lucide-react";
import type { HostelStats } from "@/lib/hostel/types";

interface HostelKpiRowProps {
  stats: HostelStats;
  onKpiClick?: (key: string) => void;
}

export function HostelKpiRow({ stats, onKpiClick }: HostelKpiRowProps) {
  const cards = [
    {
      key: "total-beds",
      label: "Total Beds",
      value: stats.totalBeds,
      sub: null,
      icon: Bed,
      bgColor: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      accent: "border-blue-100 dark:border-blue-900/40",
    },
    {
      key: "occupied-beds",
      label: "Occupied Beds",
      value: stats.occupiedBeds,
      sub: `${stats.overallOccupancyRate}%`,
      subColor: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
      icon: Users,
      bgColor: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
      accent: "border-red-100 dark:border-red-900/40",
    },
    {
      key: "available-beds",
      label: "Available Beds",
      value: stats.availableBeds,
      sub: `${Math.round((stats.availableBeds / stats.totalBeds) * 100)}%`,
      subColor: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
      icon: BedDouble,
      bgColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      accent: "border-emerald-100 dark:border-emerald-900/40",
    },
    {
      key: "reserved-beds",
      label: "Reserved Beds",
      value: stats.reservedBeds,
      sub: `${Math.round((stats.reservedBeds / stats.totalBeds) * 100)}%`,
      subColor: "text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
      icon: Lock,
      bgColor: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      accent: "border-amber-100 dark:border-amber-900/40",
    },
    {
      key: "pending-requests",
      label: "Pending Requests",
      value: stats.pendingRequests,
      sub: null,
      icon: FileText,
      bgColor: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
      accent: "border-rose-100 dark:border-rose-900/40",
    },
    {
      key: "maintenance",
      label: "Maintenance",
      value: stats.maintenanceBeds,
      sub: `${Math.round((stats.maintenanceBeds / stats.totalBeds) * 100)}%`,
      subColor: "text-purple-700 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
      icon: Wrench,
      bgColor: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
      accent: "border-purple-100 dark:border-purple-900/40",
    },
    {
      key: "check-ins",
      label: "Today's Check-ins",
      value: stats.todayCheckIns,
      sub: null,
      icon: LogIn,
      bgColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      accent: "border-emerald-100 dark:border-emerald-900/40",
    },
    {
      key: "check-outs",
      label: "Today's Check-outs",
      value: stats.todayCheckOuts,
      sub: null,
      icon: LogOut,
      bgColor: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
      accent: "border-rose-100 dark:border-rose-900/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.key}
            onClick={() => onKpiClick?.(c.key)}
            className={`flex flex-col justify-between rounded-xl border bg-card p-3 shadow-2xs transition-all hover:shadow-xs cursor-pointer ${c.accent}`}
          >
            <div className="flex items-center justify-between">
              <div className={`flex size-8 items-center justify-center rounded-lg ${c.bgColor}`}>
                <Icon className="size-4.5" />
              </div>
              {c.sub && (
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${c.subColor}`}>
                  {c.sub}
                </span>
              )}
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold tracking-tight text-foreground">{c.value}</div>
              <div className="text-[11px] font-medium text-muted-foreground truncate">{c.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
