"use client";

/**
 * Create Transport Plan — 5-step stepper
 * Steps: Event → Route & Stops → Vehicle & Driver → Passengers → Review & Publish
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, Check, ChevronRight, Truck, Users, MapPin, ClipboardCheck, ArrowLeft, XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { logisticsService } from "@/lib/logistics/logistics-service";
import type { TransportType } from "@/lib/logistics/types";

// ---------------------------------------------------------------------------
// Stepper config
// ---------------------------------------------------------------------------
const STEPS = [
  { id: 1, label: "Event", description: "Plan details & linked event", icon: CalendarDays },
  { id: 2, label: "Route & Stops", description: "Pickup route and stops", icon: MapPin },
  { id: 3, label: "Vehicle & Driver", description: "Assign transport resources", icon: Truck },
  { id: 4, label: "Passengers", description: "Estimate passenger count", icon: Users },
  { id: 5, label: "Review & Publish", description: "Confirm and publish", icon: ClipboardCheck },
];

const TRANSPORT_TYPES: TransportType[] = [
  "Pickup", "Drop", "Transfer", "Event Transport", "Exam Transport", "Station Pickup", "Hostel Transfer",
];

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------
interface FormState {
  // Step 1
  title: string;
  linkedType: string;
  linkedId: string;
  linkedLabel: string;
  serviceDate: string;
  transportType: TransportType | "";
  origin: string;
  destination: string;
  coordinatorName: string;
  hasReturnTrip: boolean;
  accessibilityNeeds: boolean;
  specialInstructions: string;
  costCentre: string;
  internalNotes: string;
  // Step 2
  routeId: string;
  // Step 3
  vehicleId: string;
  driverId: string;
  // Step 4
  passengerEstimate: string;
  // Status
  saveAsDraft: boolean;
}

interface FormErrors {
  title?: string;
  linkedId?: string;
  serviceDate?: string;
  transportType?: string;
  origin?: string;
  destination?: string;
  coordinatorName?: string;
  passengerEstimate?: string;
}

const EMPTY: FormState = {
  title: "",
  linkedType: "programme",
  linkedId: "",
  linkedLabel: "",
  serviceDate: "",
  transportType: "",
  origin: "",
  destination: "",
  coordinatorName: "Sanjay Kulkarni",
  hasReturnTrip: false,
  accessibilityNeeds: false,
  specialInstructions: "",
  costCentre: "",
  internalNotes: "",
  routeId: "",
  vehicleId: "",
  driverId: "",
  passengerEstimate: "",
  saveAsDraft: false,
};

export default function NewPlanPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const programmes = logisticsService.getProgrammes();
  const routes = logisticsService.getRoutes();
  const vehicles = logisticsService.getAvailableVehicles(
    Number(form.passengerEstimate) || 0,
  );
  const drivers = logisticsService.getAvailableDrivers();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // ---------------------------------------------------------------------------
  // Step validation
  // ---------------------------------------------------------------------------
  function validateStep1(): boolean {
    const next: FormErrors = {};
    if (!form.title.trim()) next.title = "Plan title is required.";
    if (!form.serviceDate) next.serviceDate = "Service date is required.";
    if (!form.transportType) next.transportType = "Select a transport type.";
    if (!form.origin.trim()) next.origin = "Origin is required.";
    if (!form.destination.trim()) next.destination = "Destination is required.";
    if (!form.coordinatorName.trim()) next.coordinatorName = "Coordinator name is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep4(): boolean {
    const est = Number(form.passengerEstimate);
    if (!form.passengerEstimate || !Number.isFinite(est) || est < 1) {
      setErrors({ passengerEstimate: "Enter a positive passenger count." });
      return false;
    }
    setErrors({});
    return true;
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 4 && !validateStep4()) return;
    setStep((s) => Math.min(5, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
    setErrors({});
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  async function handleSubmit(publish: boolean) {
    if (!validateStep4()) return;
    setSubmitting(true);
    setSubmitError(null);

    const result = logisticsService.createPlan({
      institutionId: "INST-001",
      campusId: "CAMP-001",
      title: form.title,
      linkedType: form.linkedType,
      linkedId: form.linkedId || null,
      linkedLabel: form.linkedLabel,
      serviceDate: form.serviceDate,
      transportType: form.transportType as TransportType,
      origin: form.origin,
      destination: form.destination,
      passengerEstimate: Number(form.passengerEstimate),
      coordinatorId: "COORD-001",
      coordinatorName: form.coordinatorName,
      status: "Draft",
      hasReturnTrip: form.hasReturnTrip,
      accessibilityNeeds: form.accessibilityNeeds,
      specialInstructions: form.specialInstructions,
      costCentre: form.costCentre,
      vendorId: null,
      internalNotes: form.internalNotes,
    });

    if (!result.ok) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    if (publish) {
      logisticsService.publishPlan(result.plan.id, "Published on creation");
    }

    setSubmitting(false);
    router.push("/institution/logistics/plans");
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <PageHeader
        title="New Transport Plan"
        description="Create a transport plan in 5 steps. You can save as draft at any point."
        action={
          <Button variant="outline" size="sm" render={<a href="/institution/logistics/plans" />}>
            <ArrowLeft className="size-4 mr-1.5" /> Back to Plans
          </Button>
        }
      />

      {/* Stepper indicator */}
      <nav aria-label="Plan creation steps">
        <ol className="flex items-center gap-2 overflow-x-auto pb-2">
          {STEPS.map((s, idx) => (
            <li key={s.id} className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => step > s.id && setStep(s.id)}
                disabled={step < s.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  step === s.id
                    ? "bg-primary text-primary-foreground"
                    : step > s.id
                    ? "bg-success/10 text-success cursor-pointer hover:bg-success/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
                aria-current={step === s.id ? "step" : undefined}
              >
                {step > s.id ? (
                  <Check className="size-4" />
                ) : (
                  <s.icon className="size-4" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {submitError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <XCircle className="size-4 mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm text-foreground">{submitError}</p>
        </div>
      )}

      {/* Step panels */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            Step {step}: {STEPS[step - 1].label}
          </CardTitle>
          <CardDescription>{STEPS[step - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>

          {/* ---- Step 1: Event ---- */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="plan-title">Plan name *</Label>
                <Input
                  id="plan-title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. CMF Batch A – Arrival Pickup"
                  className="mt-1.5"
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="plan-linked">Linked programme (optional)</Label>
                  <Select
                    value={form.linkedId || undefined}
                    onValueChange={(v) => {
                      const prog = programmes.find((p) => p.id === v);
                      set("linkedId", v ?? "");
                      set("linkedLabel", prog?.title ?? "");
                    }}
                  >
                    <SelectTrigger id="plan-linked" className="mt-1.5">
                      <SelectValue placeholder="Select programme" />
                    </SelectTrigger>
                    <SelectContent>
                      {programmes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="plan-date">Service date *</Label>
                  <Input
                    id="plan-date"
                    type="date"
                    value={form.serviceDate}
                    onChange={(e) => set("serviceDate", e.target.value)}
                    className="mt-1.5 font-mono"
                    aria-invalid={Boolean(errors.serviceDate)}
                  />
                  {errors.serviceDate && <p className="mt-1 text-xs text-destructive">{errors.serviceDate}</p>}
                </div>

                <div>
                  <Label htmlFor="plan-type">Transport type *</Label>
                  <Select
                    value={form.transportType || undefined}
                    onValueChange={(v) => set("transportType", v as TransportType)}
                  >
                    <SelectTrigger id="plan-type" className="mt-1.5" aria-invalid={Boolean(errors.transportType)}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.transportType && <p className="mt-1 text-xs text-destructive">{errors.transportType}</p>}
                </div>

                <div>
                  <Label htmlFor="plan-coordinator">Coordinator *</Label>
                  <Input
                    id="plan-coordinator"
                    value={form.coordinatorName}
                    onChange={(e) => set("coordinatorName", e.target.value)}
                    placeholder="Coordinator name"
                    className="mt-1.5"
                    aria-invalid={Boolean(errors.coordinatorName)}
                  />
                  {errors.coordinatorName && <p className="mt-1 text-xs text-destructive">{errors.coordinatorName}</p>}
                </div>

                <div>
                  <Label htmlFor="plan-origin">Origin *</Label>
                  <Input
                    id="plan-origin"
                    value={form.origin}
                    onChange={(e) => set("origin", e.target.value)}
                    placeholder="e.g. Pune Railway Station"
                    className="mt-1.5"
                    aria-invalid={Boolean(errors.origin)}
                  />
                  {errors.origin && <p className="mt-1 text-xs text-destructive">{errors.origin}</p>}
                </div>

                <div>
                  <Label htmlFor="plan-destination">Destination *</Label>
                  <Input
                    id="plan-destination"
                    value={form.destination}
                    onChange={(e) => set("destination", e.target.value)}
                    placeholder="e.g. VAMNICOM Campus"
                    className="mt-1.5"
                    aria-invalid={Boolean(errors.destination)}
                  />
                  {errors.destination && <p className="mt-1 text-xs text-destructive">{errors.destination}</p>}
                </div>

                <div>
                  <Label htmlFor="plan-cost-centre">Cost centre</Label>
                  <Input
                    id="plan-cost-centre"
                    value={form.costCentre}
                    onChange={(e) => set("costCentre", e.target.value)}
                    placeholder="e.g. CC-01"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.hasReturnTrip}
                    onChange={(e) => set("hasReturnTrip", e.target.checked)}
                    className="rounded"
                    id="plan-return"
                  />
                  Include return trip
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.accessibilityNeeds}
                    onChange={(e) => set("accessibilityNeeds", e.target.checked)}
                    className="rounded"
                    id="plan-accessibility"
                  />
                  Accessibility needs (wheelchair ramp required)
                </label>
              </div>

              <div>
                <Label htmlFor="plan-instructions">Special instructions</Label>
                <Textarea
                  id="plan-instructions"
                  value={form.specialInstructions}
                  onChange={(e) => set("specialInstructions", e.target.value)}
                  placeholder="Any special instructions for passengers or driver…"
                  className="mt-1.5"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* ---- Step 2: Route & Stops ---- */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Select an existing route or leave blank to assign later. Routes define ordered pickup stops.
              </p>
              <div>
                <Label htmlFor="plan-route">Route</Label>
                <Select value={form.routeId || undefined} onValueChange={(v) => set("routeId", v ?? "")}>
                  <SelectTrigger id="plan-route" className="mt-1.5">
                    <SelectValue placeholder="Select route (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} · {r.stops.length} stops
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.routeId && (() => {
                const route = routes.find((r) => r.id === form.routeId);
                if (!route) return null;
                return (
                  <div className="rounded-xl border border-border p-4">
                    <p className="font-medium text-sm mb-3">{route.name}</p>
                    <ol className="flex flex-col gap-2">
                      {route.stops.map((stop) => (
                        <li key={stop.id} className="flex items-start gap-3 text-sm">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {stop.sequence}
                          </span>
                          <div>
                            <p className="font-medium text-foreground">{stop.locationName}</p>
                            <p className="text-xs text-muted-foreground">
                              {stop.pickupWindowStart}–{stop.pickupWindowEnd} · {stop.address}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })()}

              <p className="text-xs text-muted-foreground">
                You can define new routes from the{" "}
                <a href="/institution/logistics/routes" className="text-primary underline">
                  Routes &amp; Pickup Points
                </a>{" "}
                page.
              </p>
            </div>
          )}

          {/* ---- Step 3: Vehicle & Driver ---- */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Showing vehicles with capacity ≥ estimated passengers and drivers currently available.
                Overlap checks run at publish time.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="plan-vehicle">Vehicle</Label>
                  <Select value={form.vehicleId || undefined} onValueChange={(v) => set("vehicleId", v ?? "")}>
                    <SelectTrigger id="plan-vehicle" className="mt-1.5">
                      <SelectValue placeholder="Select vehicle (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.length === 0 && (
                        <SelectItem value="_none" disabled>No available vehicles</SelectItem>
                      )}
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.assetCode} · {v.type} · {v.seatingCapacity} seats
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="plan-driver">Driver</Label>
                  <Select value={form.driverId || undefined} onValueChange={(v) => set("driverId", v ?? "")}>
                    <SelectTrigger id="plan-driver" className="mt-1.5">
                      <SelectValue placeholder="Select driver (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.length === 0 && (
                        <SelectItem value="_none" disabled>No available drivers</SelectItem>
                      )}
                      {drivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} · {d.availability}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Both vehicle and driver are required before a plan can be published.
                You may save as Draft now and assign later.
              </p>
            </div>
          )}

          {/* ---- Step 4: Passengers ---- */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="plan-passengers">Expected passengers *</Label>
                <Input
                  id="plan-passengers"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={form.passengerEstimate}
                  onChange={(e) => set("passengerEstimate", e.target.value)}
                  placeholder="e.g. 22"
                  className="mt-1.5 font-mono max-w-xs"
                  aria-invalid={Boolean(errors.passengerEstimate)}
                />
                {errors.passengerEstimate && (
                  <p className="mt-1 text-xs text-destructive">{errors.passengerEstimate}</p>
                )}
              </div>

              {form.vehicleId && (() => {
                const v = logisticsService.getVehicles().find((veh) => veh.id === form.vehicleId);
                if (!v) return null;
                const est = Number(form.passengerEstimate);
                const over = est > v.seatingCapacity;
                return (
                  <div className={cn(
                    "rounded-lg border p-3 text-sm",
                    over ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-success/30 bg-success/5 text-success",
                  )}>
                    {over
                      ? `⚠ Passengers (${est}) exceed ${v.assetCode} capacity (${v.seatingCapacity}). Choose a larger vehicle or split into multiple trips.`
                      : `✓ ${v.assetCode} can carry ${v.seatingCapacity} passengers — ${v.seatingCapacity - est} spare seats.`}
                  </div>
                );
              })()}

              <div>
                <Label htmlFor="plan-internal-notes">Internal notes</Label>
                <Textarea
                  id="plan-internal-notes"
                  value={form.internalNotes}
                  onChange={(e) => set("internalNotes", e.target.value)}
                  placeholder="Internal notes for coordinators only (not visible to trainees)"
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </div>
          )}

          {/* ---- Step 5: Review & Publish ---- */}
          {step === 5 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border p-4 grid gap-3 text-sm">
                <ReviewRow label="Plan name" value={form.title} />
                <ReviewRow label="Linked to" value={form.linkedLabel || "—"} />
                <ReviewRow label="Service date" value={form.serviceDate} />
                <ReviewRow label="Transport type" value={form.transportType} />
                <ReviewRow label="Origin" value={form.origin} />
                <ReviewRow label="Destination" value={form.destination} />
                <ReviewRow label="Coordinator" value={form.coordinatorName} />
                <ReviewRow label="Passengers" value={form.passengerEstimate} />
                <ReviewRow label="Return trip" value={form.hasReturnTrip ? "Yes" : "No"} />
                <ReviewRow label="Accessibility" value={form.accessibilityNeeds ? "Yes" : "No"} />
                {form.vehicleId && (
                  <ReviewRow
                    label="Vehicle"
                    value={logisticsService.getVehicles().find((v) => v.id === form.vehicleId)?.assetCode ?? form.vehicleId}
                  />
                )}
                {form.driverId && (
                  <ReviewRow
                    label="Driver"
                    value={logisticsService.getDrivers().find((d) => d.id === form.driverId)?.name ?? form.driverId}
                  />
                )}
                {form.routeId && (
                  <ReviewRow
                    label="Route"
                    value={logisticsService.getRoutes().find((r) => r.id === form.routeId)?.name ?? form.routeId}
                  />
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                <strong>Save as Draft</strong> — saves without notifying anyone. You can edit and publish later.
                <br />
                <strong>Publish</strong> — notifies the coordinator, linked trainer and affected trainees.
                Requires vehicle and driver to be assigned.
              </p>
            </div>
          )}

          {/* ---- Navigation ---- */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <Button variant="outline" onClick={goBack} disabled={step === 1}>
              <ArrowLeft className="size-4 mr-1.5" /> Back
            </Button>
            <div className="flex gap-2">
              {step < 5 ? (
                <Button onClick={goNext}>
                  Next <ChevronRight className="size-4 ml-1.5" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    disabled={submitting}
                    onClick={() => handleSubmit(false)}
                    id="plan-save-draft"
                  >
                    Save as Draft
                  </Button>
                  <Button
                    disabled={submitting}
                    onClick={() => handleSubmit(true)}
                    id="plan-publish"
                  >
                    <Check className="size-4 mr-1.5" />
                    {submitting ? "Publishing…" : "Publish Plan"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <dt className="text-muted-foreground min-w-[130px] shrink-0">{label}</dt>
      <dd className="font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
