"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Check, Clock, Map, Truck, UserCheck, Users,
  AlertTriangle, XCircle, RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logisticsService } from "@/lib/logistics/logistics-service";
import { TripStatusBadge } from "@/components/logistics/status-badges";
import type { Trip, TripWithDetails, TripStatus } from "@/lib/logistics/types";

const DEMO_TRANSITIONS: Partial<Record<TripStatus, TripStatus[]>> = {
  Unassigned: ["Assigned", "Cancelled"],
  Assigned: ["Ready", "Cancelled"],
  Ready: ["Boarding", "Cancelled"],
  Boarding: ["Departed"],
  Departed: ["Arrived", "Delayed", "Incident", "Cancelled"],
  Delayed: ["Departed", "Cancelled"],
  Arrived: ["Completed"],
  Incident: ["Delayed", "Cancelled"],
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
  });
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Assign resources form
  const [assignVehicle, setAssignVehicle] = useState("");
  const [assignDriver, setAssignDriver] = useState("");
  const [assignRoute, setAssignRoute] = useState("");
  const [assignReason, setAssignReason] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Status transition
  const [toStatus, setToStatus] = useState<TripStatus | "">("");
  const [statusReason, setStatusReason] = useState("");
  const [delayMinutes, setDelayMinutes] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  function refresh() {
    const all = logisticsService.getTripsWithDetails();
    const found = all.find((t) => t.id === tripId);
    if (found) {
      setTrip(found);
      setAssignVehicle(found.vehicleId ?? "");
      setAssignDriver(found.driverId ?? "");
      setAssignRoute(found.routeId ?? "");
    } else {
      setError("Trip not found.");
    }
    setReady(true);
  }

  useEffect(() => {
    refresh();
    const unsub = logisticsService.subscribe(refresh);
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const vehicles = logisticsService.getAvailableVehicles();
  const drivers = logisticsService.getAvailableDrivers();
  const routes = logisticsService.getRoutes();
  const passengers = trip ? logisticsService.getPassengersForTrip(trip.id) : [];
  const availableTransitions = trip ? (DEMO_TRANSITIONS[trip.status] ?? []) : [];

  async function handleAssign() {
    if (!trip) return;
    setAssigning(true);
    setActionError(null);
    const result = logisticsService.assignTripResources(
      trip.id, assignVehicle, assignDriver, assignRoute, assignReason,
    );
    if (!result.ok) setActionError(result.error);
    setAssigning(false);
  }

  async function handleTransition() {
    if (!trip || !toStatus) return;
    setTransitioning(true);
    setActionError(null);
    const result = logisticsService.transitionTripStatus(
      trip.id,
      toStatus,
      statusReason,
      toStatus === "Delayed" ? Number(delayMinutes) || undefined : undefined,
    );
    if (!result.ok) setActionError(result.error);
    else { setToStatus(""); setStatusReason(""); setDelayMinutes(""); }
    setTransitioning(false);
  }

  if (!ready) return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <Skeleton className="h-10 w-64" />
      {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
    </div>
  );

  if (error || !trip) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <XCircle className="size-10 text-destructive" />
      <p className="font-medium">{error ?? "Trip not found"}</p>
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="size-4 mr-1.5" /> Go Back
      </Button>
    </div>
  );

  const overCapacity = trip.assignedPassengers > trip.seatingCapacity;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader
        title={trip.tripCode}
        description={trip.planTitle}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="size-4 mr-1.5" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
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

      {/* ---- Summary card ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile icon={Clock} label="Departure" value={fmtDateTime(trip.departureTime)} />
        <SummaryTile icon={Truck} label="Vehicle" value={trip.vehicleAssetCode ?? "Not assigned"} missing={!trip.vehicleAssetCode} />
        <SummaryTile icon={UserCheck} label="Driver" value={trip.driverName ?? "Not assigned"} missing={!trip.driverName} />
        <SummaryTile
          icon={Users}
          label="Passengers"
          value={`${trip.assignedPassengers} / ${trip.seatingCapacity}`}
          alert={overCapacity}
        />
      </div>

      {/* Route */}
      {trip.routeName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Map className="size-4 shrink-0" />
          <span>{trip.origin} → {trip.destination} via <strong className="text-foreground">{trip.routeName}</strong></span>
        </div>
      )}

      {/* ---- Status + status change ---- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-heading text-base">Trip Status</CardTitle>
            <TripStatusBadge status={trip.status} />
          </div>
        </CardHeader>
        <CardContent>
          {trip.status === "Delayed" && (
            <div className="mb-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
              <AlertTriangle className="inline size-4 mr-1.5" />
              Delayed {trip.delayMinutes} minutes
              {trip.confirmedEta && ` · Confirmed ETA: ${fmtDateTime(trip.confirmedEta)}`}
            </div>
          )}

          {availableTransitions.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="trip-status-to">Move to status</Label>
                  <Select value={toStatus} onValueChange={(v) => setToStatus(v as TripStatus)}>
                    <SelectTrigger id="trip-status-to" className="w-44">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTransitions.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {toStatus === "Delayed" && (
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="delay-minutes">Delay (minutes)</Label>
                    <Input
                      id="delay-minutes"
                      type="number"
                      min={1}
                      value={delayMinutes}
                      onChange={(e) => setDelayMinutes(e.target.value)}
                      className="w-28 font-mono"
                    />
                  </div>
                )}
              </div>
              {toStatus && (
                <>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="status-reason">
                      Reason {["Cancelled", "Delayed"].includes(toStatus) ? "*" : "(optional)"}
                    </Label>
                    <Textarea
                      id="status-reason"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Explain the status change…"
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={handleTransition}
                    disabled={transitioning}
                    className="self-start"
                    id="trip-status-submit"
                  >
                    <Check className="size-4 mr-1.5" />
                    {transitioning ? "Updating…" : `Set to ${toStatus}`}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No further transitions available for status <strong>{trip.status}</strong>.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---- Assign Resources ---- */}
      {!["Completed", "Cancelled"].includes(trip.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Assign Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="assign-vehicle">Vehicle</Label>
                <Select value={assignVehicle || undefined} onValueChange={(v) => setAssignVehicle(v ?? "")}>
                  <SelectTrigger id="assign-vehicle" className="mt-1.5">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.assetCode} · {v.seatingCapacity} seats
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assign-driver">Driver</Label>
                <Select value={assignDriver || undefined} onValueChange={(v) => setAssignDriver(v ?? "")}>
                  <SelectTrigger id="assign-driver" className="mt-1.5">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assign-route">Route</Label>
                <Select value={assignRoute || undefined} onValueChange={(v) => setAssignRoute(v ?? "")}>
                  <SelectTrigger id="assign-route" className="mt-1.5">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor="assign-reason">Reason (required if plan is Published)</Label>
              <Textarea
                id="assign-reason"
                value={assignReason}
                onChange={(e) => setAssignReason(e.target.value)}
                placeholder="Reason for this assignment…"
                rows={2}
                className="mt-1.5"
              />
            </div>
            <Button
              className="mt-3"
              onClick={handleAssign}
              disabled={assigning || !assignVehicle || !assignDriver}
              id="assign-resources-submit"
            >
              <Check className="size-4 mr-1.5" />
              {assigning ? "Saving…" : "Save Assignment"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---- Passengers ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            Passengers ({passengers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {passengers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No passengers assigned to this trip yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Name</th>
                    <th className="pb-2 font-medium text-muted-foreground">Code</th>
                    <th className="pb-2 font-medium text-muted-foreground">Pickup Stop</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {passengers.slice(0, 20).map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 font-medium">{p.traineeName}</td>
                      <td className="py-2 font-mono text-xs text-muted-foreground">{p.traineeCode}</td>
                      <td className="py-2 text-muted-foreground">{p.pickupStopName ?? "—"}</td>
                      <td className="py-2">
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          p.status === "Boarded" ? "bg-success/10 text-success" :
                          p.status === "No-show" ? "bg-destructive/10 text-destructive" :
                          "bg-muted text-muted-foreground",
                        )}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {passengers.length > 20 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing 20 of {passengers.length} passengers. Full manifest available on the{" "}
                  <a href="/institution/logistics/manifest" className="text-primary underline">Passenger Manifest</a> page.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  icon: Icon, label, value, missing, alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  missing?: boolean;
  alert?: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col gap-2 rounded-2xl border p-4",
      missing && "border-destructive/30 bg-destructive/5",
      alert && "border-warning/30 bg-warning/5",
      !missing && !alert && "border-border bg-card",
    )}>
      <span className={cn(
        "flex size-9 items-center justify-center rounded-xl",
        missing ? "bg-destructive/10 text-destructive" :
        alert ? "bg-warning/10 text-warning" :
        "bg-tint-red-bg text-tint-red-fg",
      )}>
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("font-semibold text-sm mt-0.5", missing ? "text-destructive" : "text-foreground")}>
          {value}
        </p>
      </div>
    </div>
  );
}
