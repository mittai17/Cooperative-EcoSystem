"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, XCircle, Check, Bus, Users, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { logisticsService } from "@/lib/logistics/logistics-service";
import { PlanStatusBadge, TripStatusBadge } from "@/components/logistics/status-badges";
import type { TransportPlan, Trip, PlanStatus } from "@/lib/logistics/types";

const VALID_TRANSITIONS: Partial<Record<PlanStatus, PlanStatus[]>> = {
  Draft: ["Pending Approval", "Cancelled"],
  "Pending Approval": ["Approved", "Cancelled"],
  Approved: ["Published", "Cancelled"],
  Published: ["Needs Review", "Completed", "Cancelled"],
  "Needs Review": ["Published", "Cancelled"],
};

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<TransportPlan | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toStatus, setToStatus] = useState<PlanStatus | "">("");
  const [reason, setReason] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    const found = logisticsService.getPlanById(planId);
    if (found) { setPlan(found); setTrips(logisticsService.getTripsForPlan(planId)); }
    else setError("Plan not found.");
    setReady(true);
  }

  useEffect(() => {
    refresh();
    const unsub = logisticsService.subscribe(refresh);
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  function handleTransition() {
    if (!plan || !toStatus) return;
    setTransitioning(true);
    let result;
    if (toStatus === "Published") {
      result = logisticsService.publishPlan(plan.id, reason);
    } else {
      result = logisticsService.transitionPlanStatus(plan.id, toStatus, reason);
    }
    if (!result.ok) setActionError(result.error);
    else { setToStatus(""); setReason(""); }
    setTransitioning(false);
  }

  if (!ready) return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Skeleton className="h-10 w-64" />
      {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
    </div>
  );

  if (error || !plan) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <XCircle className="size-10 text-destructive" />
      <p className="font-medium">{error ?? "Plan not found"}</p>
      <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="size-4 mr-1.5" /> Back</Button>
    </div>
  );

  const available = VALID_TRANSITIONS[plan.status] ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <PageHeader
        title={plan.title}
        description={plan.linkedLabel}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="size-4 mr-1.5" /> Back</Button>
            <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="size-4" /></Button>
          </div>
        }
      />

      {plan.needsReviewReason && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <XCircle className="size-4 mt-0.5 shrink-0" />
          {plan.needsReviewReason}
        </div>
      )}

      {actionError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <XCircle className="size-4 mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm text-foreground">{actionError}</p>
          <Button variant="ghost" size="sm" className="ml-auto shrink-0" onClick={() => setActionError(null)}>Dismiss</Button>
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardHeader><div className="flex items-center justify-between"><CardTitle className="font-heading text-base">Plan Details</CardTitle><PlanStatusBadge status={plan.status} /></div></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {[
              { label: "Service Date", value: plan.serviceDate },
              { label: "Transport Type", value: plan.transportType },
              { label: "Origin", value: plan.origin },
              { label: "Destination", value: plan.destination },
              { label: "Passengers", value: String(plan.passengerEstimate) },
              { label: "Coordinator", value: plan.coordinatorName },
              { label: "Cost Centre", value: plan.costCentre || "—" },
              { label: "Return Trip", value: plan.hasReturnTrip ? "Yes" : "No" },
              { label: "Accessibility", value: plan.accessibilityNeeds ? "Yes" : "No" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="font-medium text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Status transition */}
      {available.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Change Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {available.map((s) => (
                <Button
                  key={s}
                  variant={toStatus === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setToStatus(s)}
                  id={`plan-status-${s.toLowerCase().replace(/ /g, "-")}`}
                >
                  {s}
                </Button>
              ))}
            </div>
            {toStatus && (
              <div className="flex flex-col gap-3 mt-3">
                <div>
                  <Label htmlFor="plan-reason">Reason {["Cancelled", "Published"].includes(toStatus) ? "*" : "(optional)"}</Label>
                  <Textarea id="plan-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain this status change…" rows={2} className="mt-1.5" />
                </div>
                <Button onClick={handleTransition} disabled={transitioning} className="self-start" id="plan-status-submit">
                  <Check className="size-4 mr-1.5" />
                  {transitioning ? "Updating…" : `Set to ${toStatus}`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Linked trips */}
      <Card>
        <CardHeader><CardTitle className="font-heading text-base">Linked Trips ({trips.length})</CardTitle></CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trips linked to this plan yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {trips.map((trip) => (
                <li key={trip.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Bus className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold">{trip.tripCode}</p>
                    <p className="text-xs text-muted-foreground">{new Date(trip.departureTime).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                    <Users className="size-3.5" />
                    {trip.assignedPassengers}/{trip.seatingCapacity}
                  </div>
                  <TripStatusBadge status={trip.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
