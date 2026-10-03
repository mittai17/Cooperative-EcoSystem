"use client";

/**
 * Trips & Assignments — list page
 * Features: search, status filter, sort by departure, pagination,
 * assign-resources action, empty/loading states.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, RefreshCw, Inbox, Users, Truck, UserCheck, Clock,
  MoreHorizontal, XCircle, Eye, AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logisticsService } from "@/lib/logistics/logistics-service";
import { TripStatusBadge } from "@/components/logistics/status-badges";
import type { TripWithDetails, TripStatus } from "@/lib/logistics/types";

const PAGE_SIZE = 20;

const ALL_STATUSES: (TripStatus | "All")[] = [
  "All", "Unassigned", "Assigned", "Ready", "Boarding", "Departed",
  "Arrived", "Completed", "Delayed", "Cancelled", "Incident",
];

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

export default function TripsPage() {
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "All">("All");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    setTrips(logisticsService.getTripsWithDetails());
    setReady(true);
  }

  useEffect(() => {
    refresh();
    const unsub = logisticsService.subscribe(refresh);
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return trips
      .filter((t) => {
        if (statusFilter !== "All" && t.status !== statusFilter) return false;
        if (!needle) return true;
        return (
          t.tripCode.toLowerCase().includes(needle) ||
          t.planTitle.toLowerCase().includes(needle) ||
          (t.vehicleAssetCode ?? "").toLowerCase().includes(needle) ||
          (t.driverName ?? "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
  }, [trips, statusFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isFiltered = query.trim() !== "" || statusFilter !== "All";

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: trips.length };
    trips.forEach((t) => { map[t.status] = (map[t.status] ?? 0) + 1; });
    return map;
  }, [trips]);

  function handleCancel(tripId: string) {
    const result = logisticsService.transitionTripStatus(tripId, "Cancelled", "Cancelled from trips list");
    if (!result.ok) setActionError(result.error);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trips & Assignments"
        description="All transport trips with vehicle, driver, route and passenger details."
        action={
          <Button variant="outline" size="sm" onClick={refresh} aria-label="Refresh trips">
            <RefreshCw className="size-4 mr-1.5" />
            Refresh
          </Button>
        }
      />

      {actionError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <XCircle className="size-4 mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm text-foreground">{actionError}</p>
          <Button variant="ghost" size="sm" className="ml-auto shrink-0" onClick={() => setActionError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-heading text-base">All Trips</CardTitle>
              <CardDescription>{filtered.length} trip{filtered.length !== 1 ? "s" : ""}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="trips-search"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder="Trip code, vehicle, driver…"
                  className="pl-9 h-9"
                  aria-label="Search trips"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as TripStatus | "All"); setPage(1); }}>
                <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "All" ? "All statuses" : s}
                      {counts[s] !== undefined && (
                        <span className="ml-1.5 font-mono text-xs text-muted-foreground">{counts[s]}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isFiltered && (
                <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setStatusFilter("All"); setPage(1); }}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!ready ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="icon-tile-red size-10">
                <Inbox className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">
                {isFiltered ? "No trips match this filter" : "No trips yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isFiltered ? "Try a different status or search term." : "Trips are created from Transport Plans."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip Code</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Passengers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((trip) => {
                    const overCapacity = trip.assignedPassengers > trip.seatingCapacity;
                    return (
                      <TableRow
                        key={trip.id}
                        className={cn(
                          trip.status === "Incident" && "bg-destructive/5",
                          trip.status === "Delayed" && "bg-warning/5",
                          trip.status === "Cancelled" && "opacity-60",
                        )}
                      >
                        <TableCell>
                          <Link
                            href={`/institution/logistics/trips/${trip.id}`}
                            className="font-mono text-sm font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {trip.tripCode}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{trip.planTitle}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Clock className="size-3.5 text-muted-foreground shrink-0" />
                            {fmtDateTime(trip.departureTime)}
                          </div>
                          {trip.status === "Delayed" && trip.delayMinutes && (
                            <p className="text-xs text-warning font-medium">+{trip.delayMinutes}m delay</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                          {trip.routeName ?? <span className="text-destructive text-xs">No route</span>}
                        </TableCell>
                        <TableCell>
                          {trip.vehicleAssetCode ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Truck className="size-3.5 text-muted-foreground shrink-0" />
                              {trip.vehicleAssetCode}
                            </div>
                          ) : (
                            <span className="text-xs text-destructive font-medium">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {trip.driverName ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <UserCheck className="size-3.5 text-muted-foreground shrink-0" />
                              {trip.driverName}
                            </div>
                          ) : (
                            <span className="text-xs text-destructive font-medium">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "flex items-center gap-1.5 text-sm font-mono",
                            overCapacity && "text-destructive font-semibold",
                          )}>
                            <Users className="size-3.5 text-muted-foreground shrink-0" />
                            {trip.assignedPassengers}/{trip.seatingCapacity}
                            {overCapacity && <AlertTriangle className="size-3.5 text-destructive" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TripStatusBadge status={trip.status} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  aria-label={`Actions for ${trip.tripCode}`}
                                  id={`trip-actions-${trip.id}`}
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem render={<Link href={`/institution/logistics/trips/${trip.id}`} />}>
                              <Eye className="size-3.5 mr-2" /> View Details
                            </DropdownMenuItem>
                              {!["Cancelled", "Completed"].includes(trip.status) && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleCancel(trip.id)}
                                >
                                  <XCircle className="size-3.5 mr-2" />
                                  Cancel Trip
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {filtered.length} trips
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
