"use client";

/**
 * Logistics Overview — Phase 1
 *
 * Layout: PageHeader → 6 KPI cards → Action Queue → Today's Timeline → Charts
 * All data from logisticsService (client-side mock, reactive).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bus,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Map,
  RefreshCw,
  TriangleAlert,
  Truck,
  Users,
  Inbox,
  ClipboardList,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logisticsService } from "@/lib/logistics/logistics-service";
import { TripStatusBadge } from "@/components/logistics/status-badges";
import type {
  LogisticsOverviewStats,
  ActionQueueItem,
  TripWithDetails,
} from "@/lib/logistics/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

// ---------------------------------------------------------------------------
// Timeline row
// ---------------------------------------------------------------------------
function TimelineRow({ trip }: { trip: TripWithDetails }) {
  const isDelayed = trip.status === "Delayed";
  const isIncident = trip.status === "Incident";
  const isCancelled = trip.status === "Cancelled";

  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border p-3 transition-colors sm:flex-row sm:items-center",
        isIncident && "border-destructive/30 bg-destructive/5",
        isDelayed && "border-warning/30 bg-warning/5",
        isCancelled && "opacity-60",
      )}
    >
      {/* Time */}
      <div className="min-w-[80px] font-mono text-sm font-semibold text-foreground">
        {fmtTime(trip.departureTime)}
        {isDelayed && trip.delayMinutes && (
          <span className="ml-1.5 text-xs text-warning font-normal">
            +{trip.delayMinutes}m
          </span>
        )}
      </div>

      {/* Trip info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {trip.tripCode}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">
          {trip.origin} → {trip.destination}
        </p>
        {trip.routeName && (
          <p className="mt-0.5 text-xs text-muted-foreground">{trip.routeName}</p>
        )}
      </div>

      {/* Vehicle / driver */}
      <div className="hidden sm:block min-w-[140px] text-sm text-foreground">
        {trip.vehicleAssetCode ?? <span className="text-destructive text-xs">No vehicle</span>}
        {trip.driverName && (
          <p className="text-xs text-muted-foreground">{trip.driverName}</p>
        )}
      </div>

      {/* Passengers */}
      <div className="hidden lg:flex items-center gap-1 min-w-[80px] text-sm">
        <Users className="size-3.5 text-muted-foreground" />
        <span className={cn(
          "font-mono",
          trip.assignedPassengers > trip.seatingCapacity ? "text-destructive font-semibold" : "text-foreground",
        )}>
          {trip.assignedPassengers}/{trip.seatingCapacity}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <TripStatusBadge status={trip.status} />
        <Link href={`/institution/logistics/trips/${trip.id}`} aria-label={`View trip ${trip.tripCode}`}>
          <ChevronRight className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
        </Link>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Action queue item
// ---------------------------------------------------------------------------
function ActionQueueRow({ item }: { item: ActionQueueItem }) {
  const isError = item.severity === "error";
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        isError
          ? "border-destructive/30 bg-destructive/5"
          : "border-warning/30 bg-warning/5",
      )}
    >
      <span className={cn("mt-0.5 shrink-0", isError ? "text-destructive" : "text-warning")}>
        {isError ? <TriangleAlert className="size-4" /> : <AlertTriangle className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{item.label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
      </div>
      <Link
        href={item.linkHref}
        className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium bg-card border border-border hover:bg-accent transition-colors"
        aria-label={`Action: ${item.label}`}
      >
        Fix
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LogisticsOverviewPage() {
  const [stats, setStats] = useState<LogisticsOverviewStats | null>(() => logisticsService.getOverviewStats());
  const [actionQueue, setActionQueue] = useState<ActionQueueItem[]>(() => logisticsService.getActionQueue());
  const [todayTrips, setTodayTrips] = useState<TripWithDetails[]>(() => logisticsService.getTodayTrips());
  const [ready] = useState(true);

  function refresh() {
    setStats(logisticsService.getOverviewStats());
    setActionQueue(logisticsService.getActionQueue());
    setTodayTrips(logisticsService.getTodayTrips());
  }

  useEffect(() => {
    const unsub = logisticsService.subscribe(refresh);
    return unsub;
  }, []);

  const kpiCards = useMemo(() => {
    if (!stats) return null;
    return [
      { label: "Trips Today", value: String(stats.tripsToday), icon: Bus, tint: "red" as const, trend: "Scheduled across all campuses" },
      { label: "Pending Requests", value: String(stats.pendingRequests), icon: ClipboardList, tint: "amber" as const, trend: "Awaiting coordinator review", trendTone: stats.pendingRequests > 0 ? "down" as const : "up" as const },
      { label: "Vehicles Available", value: String(stats.vehiclesAvailable), icon: Truck, tint: "blue" as const, trend: "Active & out of maintenance" },
      { label: "Passengers Expected", value: String(stats.passengersExpected), icon: Users, tint: "violet" as const, trend: "Today's total boarding count" },
      { label: "Active Incidents", value: String(stats.activeIncidents), icon: AlertTriangle, tint: stats.activeIncidents > 0 ? "red" as const : "green" as const, trend: stats.activeIncidents === 0 ? "No open incidents" : "Needs attention", trendTone: stats.activeIncidents > 0 ? "down" as const : "up" as const },
      { label: "Trips Needing Assignment", value: String(stats.tripsNeedingAssignment), icon: CalendarClock, tint: stats.tripsNeedingAssignment > 0 ? "amber" as const : "green" as const, trend: "No vehicle or driver assigned", trendTone: stats.tripsNeedingAssignment > 0 ? "down" as const : "up" as const },
    ];
  }, [stats]);

  return (
    <div className="flex flex-col gap-8">
      {/* ---- Header ---- */}
      <PageHeader
        title="Logistics Management"
        description="Physical movement, transport plans, trips, vehicles and drivers for all programmes and events."
        action={
          <div className="flex items-center gap-2">
            <span className="demo-data-tag">VAMNICOM Pune · demo</span>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              aria-label="Refresh logistics overview"
            >
              <RefreshCw className={cn("size-4", !ready && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" render={<Link href="/institution/logistics/plans/new" />}>
              <Truck className="size-4 mr-1.5" />
              New Plan
            </Button>
          </div>
        }
      />

      {/* ---- KPI Row ---- */}
      {!ready ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {kpiCards?.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              tint={card.tint}
              trend={card.trend}
              trendTone={card.trendTone ?? "neutral"}
            />
          ))}
        </div>
      )}

      {/* ---- Action Queue + Today's Operations ---- */}
      <div className="grid gap-6 xl:grid-cols-5">
        {/* Action Queue */}
        <Card className="xl:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <TriangleAlert className="size-4 text-warning" />
              Action Queue
            </CardTitle>
            <CardDescription>
              Items requiring immediate coordinator attention
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {!ready ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : actionQueue.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="icon-tile-green size-10">
                  <CheckCircle2 className="size-5" />
                </span>
                <p className="text-sm text-muted-foreground">No action items — everything looks good.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {actionQueue.slice(0, 8).map((item) => (
                  <ActionQueueRow key={item.id} item={item} />
                ))}
                {actionQueue.length > 8 && (
                  <li className="text-center text-xs text-muted-foreground pt-1">
                    +{actionQueue.length - 8} more items
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Today's Operations Timeline */}
        <Card className="xl:col-span-3">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  Today&apos;s Operations
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </CardDescription>
              </div>
              <Link
                href="/institution/logistics/trips"
                className="text-xs text-primary hover:underline font-medium"
              >
                All trips →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {!ready ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : todayTrips.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="icon-tile-red size-10">
                  <Inbox className="size-5" />
                </span>
                <p className="text-sm font-medium text-foreground">No trips scheduled today</p>
                <p className="text-xs text-muted-foreground">
                  Create a transport plan to schedule trips for today.
                </p>
                <Button size="sm" variant="outline" render={<Link href="/institution/logistics/plans/new" />}>
                  New Transport Plan
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
                {todayTrips
                  .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
                  .map((trip) => (
                    <TimelineRow key={trip.id} trip={trip} />
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Quick nav cards ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Transport Plans", desc: "Create, approve and publish plans", href: "/institution/logistics/plans", icon: ClipboardList, tint: "bg-tint-red-bg text-tint-red-fg" },
          { label: "Trips & Assignments", desc: "Assign vehicles, drivers and routes", href: "/institution/logistics/trips", icon: Bus, tint: "bg-tint-blue-bg text-tint-blue-fg" },
          { label: "Vehicles & Drivers", desc: "Registry, availability and compliance", href: "/institution/logistics/vehicles", icon: Truck, tint: "bg-tint-violet-bg text-tint-violet-fg" },
          { label: "Routes & Stops", desc: "Define pickup points and windows", href: "/institution/logistics/routes", icon: Map, tint: "bg-tint-green-bg text-tint-green-fg" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            <span className={cn("size-10 flex items-center justify-center rounded-2xl", item.tint)}>
              <item.icon className="size-5" />
            </span>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary ml-auto mt-auto transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
