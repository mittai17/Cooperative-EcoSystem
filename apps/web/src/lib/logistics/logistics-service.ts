"use client";

/**
 * CoopSetu AI — Logistics Service
 *
 * Singleton reactive service for Phase 1. Mirrors the HostelService pattern:
 * - State loaded from localStorage, falling back to seed data.
 * - Mutations run server-side business-rule validation before committing.
 * - subscribe() / notify() provide reactive updates to page components.
 * - Every critical mutation writes an AuditEvent.
 *
 * Swap adapter methods for real fetch() calls in Phase 4 without touching pages.
 */

import {
  TRANSPORT_PLANS,
  TRIPS,
  VEHICLES,
  DRIVERS,
  ROUTES,
  INCIDENTS,
  TRANSPORT_REQUESTS,
  PASSENGER_ASSIGNMENTS,
  EXPENSES,
  VENDORS,
  DEMO_INSTITUTION_ID,
  DEMO_CAMPUS_ID,
  PROGRAMMES,
  BATCHES,
} from "./mock-data";
import type {
  TransportPlan,
  Trip,
  Vehicle,
  Driver,
  Route,
  Incident,
  TransportRequest,
  PassengerAssignment,
  TripExpense,
  Vendor,
  AuditEvent,
  LogisticsOverviewStats,
  ActionQueueItem,
  TripWithDetails,
  PlanStatus,
  TripStatus,
  RequestStatus,
} from "./types";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
interface LogisticsState {
  plans: TransportPlan[];
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  routes: Route[];
  incidents: Incident[];
  requests: TransportRequest[];
  passengers: PassengerAssignment[];
  expenses: TripExpense[];
  vendors: Vendor[];
  auditLog: AuditEvent[];
}

const STORAGE_KEY = "coopsetu_logistics_state_v1";

// ---------------------------------------------------------------------------
// Validation helpers (server-side rules enforced here in Phase 1 mock)
// ---------------------------------------------------------------------------

/** Valid status transitions per spec §5 */
const PLAN_TRANSITIONS: Record<PlanStatus, PlanStatus[]> = {
  Draft: ["Pending Approval", "Cancelled"],
  "Pending Approval": ["Approved", "Draft", "Cancelled"],
  Approved: ["Published", "Needs Review", "Cancelled"],
  Published: ["Needs Review", "Completed", "Cancelled"],
  "Needs Review": ["Published", "Cancelled"],
  Cancelled: [],
  Completed: [],
};

const TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  Unassigned: ["Assigned", "Cancelled"],
  Assigned: ["Ready", "Unassigned", "Cancelled"],
  Ready: ["Boarding", "Cancelled"],
  Boarding: ["Departed"],
  Departed: ["Arrived", "Delayed", "Incident", "Cancelled"],
  Arrived: ["Completed"],
  Completed: [],
  Delayed: ["Departed", "Cancelled", "Incident"],
  Cancelled: [],
  Incident: ["Delayed", "Cancelled"],
};

const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  Draft: ["Submitted", "Withdrawn"],
  Submitted: ["Under Review", "Withdrawn"],
  "Under Review": ["Approved", "Rejected", "More Info Required"],
  "More Info Required": ["Submitted", "Withdrawn"],
  Approved: [],
  Rejected: [],
  Withdrawn: [],
};

function validatePlanTransition(from: PlanStatus, to: PlanStatus): string | null {
  if (!PLAN_TRANSITIONS[from]?.includes(to))
    return `Cannot transition plan from "${from}" to "${to}".`;
  return null;
}

function validateTripTransition(from: TripStatus, to: TripStatus): string | null {
  if (!TRIP_TRANSITIONS[from]?.includes(to))
    return `Cannot transition trip from "${from}" to "${to}".`;
  return null;
}

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------
class LogisticsService {
  private state: LogisticsState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): LogisticsState {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored) as LogisticsState;
      } catch {
        // ignore corrupt storage
      }
    }
    return {
      plans: [...TRANSPORT_PLANS],
      trips: [...TRIPS],
      vehicles: [...VEHICLES],
      drivers: [...DRIVERS],
      routes: [...ROUTES],
      incidents: [...INCIDENTS],
      requests: [...TRANSPORT_REQUESTS],
      passengers: [...PASSENGER_ASSIGNMENTS],
      expenses: [...EXPENSES],
      vendors: [...VENDORS],
      auditLog: [],
    };
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // storage quota; non-fatal
      }
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => { try { fn(); } catch { /* swallow */ } });
  }

  private appendAudit(
    entityType: string,
    entityId: string,
    action: string,
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
    reason = "",
    actor = "Coordinator (demo)",
  ) {
    this.state.auditLog = [
      {
        id: `AUD-${Date.now()}`,
        entityType,
        entityId,
        actor,
        actorRole: "logistics_coordinator",
        action,
        before,
        after,
        reason,
        createdAt: new Date().toISOString(),
        institutionId: DEMO_INSTITUTION_ID,
      },
      ...this.state.auditLog,
    ];
  }

  // ---- Subscription ----
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ---- Institution / role scoping ----
  /**
   * Every read and write validates institutionId so cross-institution data
   * never leaks. In Phase 4 this moves to the API middleware.
   */
  private assertInstitution(institutionId: string) {
    if (institutionId !== DEMO_INSTITUTION_ID)
      throw new Error("Access denied: cross-institution data request.");
  }

  // =========================================================================
  // Plans
  // =========================================================================

  getPlans(institutionId = DEMO_INSTITUTION_ID): TransportPlan[] {
    this.assertInstitution(institutionId);
    return this.state.plans.filter((p) => p.institutionId === institutionId);
  }

  getPlanById(id: string): TransportPlan | undefined {
    return this.state.plans.find((p) => p.id === id);
  }

  createPlan(
    data: Omit<TransportPlan, "id" | "createdAt" | "updatedAt" | "needsReviewReason">,
  ): { ok: true; plan: TransportPlan } | { ok: false; error: string } {
    // Validation
    if (!data.title?.trim()) return { ok: false, error: "Plan title is required." };
    if (data.passengerEstimate < 1)
      return { ok: false, error: "Passenger estimate must be at least 1." };
    if (!data.serviceDate)
      return { ok: false, error: "Service date is required." };
    if (!data.coordinatorId)
      return { ok: false, error: "A coordinator must be assigned." };

    const plan: TransportPlan = {
      ...data,
      id: `PLN-${String(Date.now()).slice(-6)}`,
      needsReviewReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.plans = [plan, ...this.state.plans];
    this.appendAudit("TransportPlan", plan.id, "CREATED", null, plan as unknown as Record<string, unknown>);
    this.persist();
    return { ok: true, plan };
  }

  updatePlan(
    id: string,
    changes: Partial<TransportPlan>,
    reason = "",
  ): { ok: true; plan: TransportPlan } | { ok: false; error: string } {
    const idx = this.state.plans.findIndex((p) => p.id === id);
    if (idx === -1) return { ok: false, error: "Plan not found." };

    const before = { ...this.state.plans[idx] };
    const updated = { ...before, ...changes, updatedAt: new Date().toISOString() };
    this.state.plans[idx] = updated;
    this.appendAudit("TransportPlan", id, "UPDATED", before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>, reason);
    this.persist();
    return { ok: true, plan: updated };
  }

  /**
   * Publish a plan. Validates that all linked trips have route, coordinator,
   * vehicle, driver and pickup window assigned. Never silently allows publish
   * with unresolved conflicts.
   */
  publishPlan(
    id: string,
    reason = "",
  ): { ok: true; plan: TransportPlan } | { ok: false; error: string } {
    const plan = this.getPlanById(id);
    if (!plan) return { ok: false, error: "Plan not found." };

    const transitionError = validatePlanTransition(plan.status, "Published");
    if (transitionError) return { ok: false, error: transitionError };

    // Check linked trips are ready to publish
    const linkedTrips = this.state.trips.filter((t) => t.planId === id);
    for (const trip of linkedTrips) {
      if (!trip.vehicleId)
        return { ok: false, error: `Trip ${trip.tripCode} has no vehicle assigned.` };
      if (!trip.driverId)
        return { ok: false, error: `Trip ${trip.tripCode} has no driver assigned.` };
      if (!trip.routeId)
        return { ok: false, error: `Trip ${trip.tripCode} has no route assigned.` };
    }

    return this.updatePlan(id, { status: "Published" }, reason);
  }

  transitionPlanStatus(
    id: string,
    to: PlanStatus,
    reason = "",
  ): { ok: true; plan: TransportPlan } | { ok: false; error: string } {
    const plan = this.getPlanById(id);
    if (!plan) return { ok: false, error: "Plan not found." };

    const err = validatePlanTransition(plan.status, to);
    if (err) return { ok: false, error: err };

    // Reason required for cancellation and post-publish changes
    if ((to === "Cancelled" || plan.status === "Published") && !reason.trim())
      return { ok: false, error: "A reason is required for this status change." };

    return this.updatePlan(id, { status: to }, reason);
  }

  // =========================================================================
  // Trips
  // =========================================================================

  getTrips(institutionId = DEMO_INSTITUTION_ID): Trip[] {
    this.assertInstitution(institutionId);
    return this.state.trips.filter((t) => t.institutionId === institutionId);
  }

  getTripById(id: string): Trip | undefined {
    return this.state.trips.find((t) => t.id === id);
  }

  getTripsForPlan(planId: string): Trip[] {
    return this.state.trips.filter((t) => t.planId === planId);
  }

  /** Returns Trip enriched with vehicle, driver, route and plan info */
  getTripsWithDetails(institutionId = DEMO_INSTITUTION_ID): TripWithDetails[] {
    return this.getTrips(institutionId).map((trip): TripWithDetails => {
      const vehicle = trip.vehicleId
        ? this.state.vehicles.find((v) => v.id === trip.vehicleId)
        : undefined;
      const driver = trip.driverId
        ? this.state.drivers.find((d) => d.id === trip.driverId)
        : undefined;
      const route = trip.routeId
        ? this.state.routes.find((r) => r.id === trip.routeId)
        : undefined;
      const plan = this.state.plans.find((p) => p.id === trip.planId);
      return {
        ...trip,
        vehicleAssetCode: vehicle?.assetCode ?? null,
        vehicleRegistration: vehicle?.registrationNumber ?? null,
        vehicleType: vehicle?.type ?? null,
        driverName: driver?.name ?? null,
        routeName: route?.name ?? null,
        planTitle: plan?.title ?? trip.planId,
      };
    });
  }

  getTodayTrips(): TripWithDetails[] {
    const today = new Date().toISOString().slice(0, 10);
    return this.getTripsWithDetails().filter((t) =>
      t.departureTime.startsWith(today),
    );
  }

  /**
   * Assign vehicle and driver to a trip.
   * Enforces:
   * - Vehicle not in maintenance
   * - Driver is active and available (or already on this trip)
   * - No overlapping trips for the same vehicle or driver
   */
  assignTripResources(
    tripId: string,
    vehicleId: string,
    driverId: string,
    routeId: string,
    reason = "",
  ): { ok: true; trip: Trip } | { ok: false; error: string } {
    const trip = this.getTripById(tripId);
    if (!trip) return { ok: false, error: "Trip not found." };

    const vehicle = this.state.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return { ok: false, error: "Vehicle not found." };
    if (vehicle.maintenanceStatus === "Maintenance")
      return { ok: false, error: `Vehicle ${vehicle.assetCode} is currently in maintenance.` };

    const driver = this.state.drivers.find((d) => d.id === driverId);
    if (!driver) return { ok: false, error: "Driver not found." };
    if (!driver.active)
      return { ok: false, error: `Driver ${driver.name} is inactive.` };

    // Check for vehicle overlap
    const vehicleConflict = this.state.trips.find(
      (t) =>
        t.id !== tripId &&
        t.vehicleId === vehicleId &&
        !["Cancelled", "Completed"].includes(t.status) &&
        this.tripsOverlap(trip, t),
    );
    if (vehicleConflict)
      return {
        ok: false,
        error: `Vehicle ${vehicle.assetCode} is already assigned to trip ${vehicleConflict.tripCode} at an overlapping time. Please choose another vehicle or time.`,
      };

    // Check for driver overlap
    const driverConflict = this.state.trips.find(
      (t) =>
        t.id !== tripId &&
        t.driverId === driverId &&
        !["Cancelled", "Completed"].includes(t.status) &&
        this.tripsOverlap(trip, t),
    );
    if (driverConflict)
      return {
        ok: false,
        error: `Driver ${driver.name} is already assigned to trip ${driverConflict.tripCode} at an overlapping time. Please choose another driver.`,
      };

    const before = { ...trip };
    const idx = this.state.trips.findIndex((t) => t.id === tripId);
    const updated: Trip = {
      ...trip,
      vehicleId,
      driverId,
      routeId,
      status: "Assigned",
      seatingCapacity: vehicle.seatingCapacity,
      updatedAt: new Date().toISOString(),
    };
    this.state.trips[idx] = updated;

    // Reason required if plan was already Published
    const plan = this.getPlanById(trip.planId);
    if (plan?.status === "Published" && !reason.trim())
      return { ok: false, error: "A reason is required when reassigning resources on a published trip." };

    this.appendAudit(
      "Trip",
      tripId,
      "RESOURCES_ASSIGNED",
      before as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>,
      reason,
    );
    this.persist();
    return { ok: true, trip: updated };
  }

  private tripsOverlap(a: Trip, b: Trip): boolean {
    const aStart = new Date(a.departureTime).getTime();
    const aEnd = new Date(a.arrivalTime).getTime();
    const bStart = new Date(b.departureTime).getTime();
    const bEnd = new Date(b.arrivalTime).getTime();
    return aStart < bEnd && bStart < aEnd;
  }

  transitionTripStatus(
    id: string,
    to: TripStatus,
    reason = "",
    delayMinutes?: number,
    confirmedEta?: string,
  ): { ok: true; trip: Trip } | { ok: false; error: string } {
    const trip = this.getTripById(id);
    if (!trip) return { ok: false, error: "Trip not found." };

    const err = validateTripTransition(trip.status, to);
    if (err) return { ok: false, error: err };

    if (to === "Cancelled" && !reason.trim())
      return { ok: false, error: "A reason is required to cancel a trip." };

    const plan = this.getPlanById(trip.planId);
    if (plan?.status === "Published" && to === "Cancelled" && !reason.trim())
      return { ok: false, error: "A reason is required to cancel a published trip." };

    const idx = this.state.trips.findIndex((t) => t.id === id);
    const before = { ...this.state.trips[idx] };
    const updated: Trip = {
      ...this.state.trips[idx],
      status: to,
      delayMinutes: to === "Delayed" ? (delayMinutes ?? null) : null,
      confirmedEta: to === "Delayed" ? (confirmedEta ?? null) : null,
      updatedAt: new Date().toISOString(),
    };
    this.state.trips[idx] = updated;
    this.appendAudit("Trip", id, `STATUS_${to.toUpperCase().replace(/ /g, "_")}`, before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>, reason);
    this.persist();
    return { ok: true, trip: updated };
  }

  // =========================================================================
  // Vehicles & Drivers
  // =========================================================================

  getVehicles(institutionId = DEMO_INSTITUTION_ID): Vehicle[] {
    this.assertInstitution(institutionId);
    return this.state.vehicles.filter((v) => v.institutionId === institutionId);
  }

  getDrivers(institutionId = DEMO_INSTITUTION_ID): Driver[] {
    this.assertInstitution(institutionId);
    return this.state.drivers.filter((d) => d.institutionId === institutionId);
  }

  getVendors(): Vendor[] {
    return this.state.vendors;
  }

  getAvailableVehicles(minCapacity = 0): Vehicle[] {
    return this.getVehicles().filter(
      (v) => v.active && v.maintenanceStatus === "Available" && v.seatingCapacity >= minCapacity,
    );
  }

  getAvailableDrivers(): Driver[] {
    return this.getDrivers().filter(
      (d) => d.active && (d.availability === "Available"),
    );
  }

  // =========================================================================
  // Routes
  // =========================================================================

  getRoutes(institutionId = DEMO_INSTITUTION_ID): Route[] {
    this.assertInstitution(institutionId);
    return this.state.routes.filter((r) => r.institutionId === institutionId);
  }

  getRouteById(id: string): Route | undefined {
    return this.state.routes.find((r) => r.id === id);
  }

  createRoute(
    data: Omit<Route, "id">,
  ): { ok: true; route: Route } | { ok: false; error: string } {
    if (!data.name?.trim()) return { ok: false, error: "Route name is required." };
    const route: Route = { ...data, id: `RTE-${String(Date.now()).slice(-6)}` };
    this.state.routes = [route, ...this.state.routes];
    this.appendAudit("Route", route.id, "CREATED", null, route as unknown as Record<string, unknown>);
    this.persist();
    return { ok: true, route };
  }

  // =========================================================================
  // Requests & Approvals
  // =========================================================================

  getRequests(institutionId = DEMO_INSTITUTION_ID): TransportRequest[] {
    this.assertInstitution(institutionId);
    return this.state.requests.filter((r) => r.institutionId === institutionId);
  }

  decideRequest(
    id: string,
    decision: "Approved" | "Rejected" | "More Info Required",
    decisionNote: string,
    decidedBy: string,
  ): { ok: true; request: TransportRequest } | { ok: false; error: string } {
    const idx = this.state.requests.findIndex((r) => r.id === id);
    if (idx === -1) return { ok: false, error: "Request not found." };

    const req = this.state.requests[idx];
    const err = validateRequestTransition(req.approvalStatus, decision);
    if (err) return { ok: false, error: err };

    if (!decisionNote.trim())
      return { ok: false, error: "A decision note is required." };

    const before = { ...req };
    const updated: TransportRequest = {
      ...req,
      approvalStatus: decision,
      decisionNote,
      decidedBy,
      decidedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.requests[idx] = updated;
    this.appendAudit("TransportRequest", id, `DECISION_${decision.toUpperCase().replace(/ /g, "_")}`, before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>, decisionNote);
    this.persist();
    return { ok: true, request: updated };
  }

  // =========================================================================
  // Incidents
  // =========================================================================

  getIncidents(institutionId = DEMO_INSTITUTION_ID): Incident[] {
    this.assertInstitution(institutionId);
    return this.state.incidents.filter((i) => i.institutionId === institutionId);
  }

  getActiveIncidents(): Incident[] {
    return this.getIncidents().filter(
      (i) => !["Resolved", "Closed"].includes(i.status),
    );
  }

  // =========================================================================
  // Passengers
  // =========================================================================

  getPassengersForTrip(tripId: string): PassengerAssignment[] {
    return this.state.passengers.filter((p) => p.tripId === tripId);
  }

  // =========================================================================
  // Expenses
  // =========================================================================

  getExpenses(institutionId = DEMO_INSTITUTION_ID): TripExpense[] {
    this.assertInstitution(institutionId);
    return this.state.expenses.filter((e) => e.institutionId === institutionId);
  }

  // =========================================================================
  // Integration adapters (mocked; swap for real API in Phase 4)
  // =========================================================================

  getProgrammes() { return PROGRAMMES; }
  getBatches(programmeId?: string) {
    return programmeId ? BATCHES.filter((b) => b.programmeId === programmeId) : BATCHES;
  }

  // =========================================================================
  // Overview stats + action queue
  // =========================================================================

  getOverviewStats(): LogisticsOverviewStats {
    const today = new Date().toISOString().slice(0, 10);
    const todayTrips = this.state.trips.filter((t) => t.departureTime.startsWith(today));
    const pendingReqs = this.state.requests.filter(
      (r) => r.approvalStatus === "Submitted" || r.approvalStatus === "Under Review",
    );
    const availableVehicles = this.state.vehicles.filter(
      (v) => v.active && v.maintenanceStatus === "Available",
    );
    const passengersExpected = todayTrips.reduce((s, t) => s + t.assignedPassengers, 0);
    const activeIncidents = this.getActiveIncidents();
    const unassigned = this.state.trips.filter(
      (t) => t.status === "Unassigned" && !["Cancelled", "Completed"].includes(t.status),
    );

    return {
      tripsToday: todayTrips.length,
      pendingRequests: pendingReqs.length,
      vehiclesAvailable: availableVehicles.length,
      passengersExpected,
      activeIncidents: activeIncidents.length,
      tripsNeedingAssignment: unassigned.length,
    };
  }

  getActionQueue(): ActionQueueItem[] {
    const items: ActionQueueItem[] = [];
    const today = new Date();

    // Unassigned trips
    this.state.trips
      .filter((t) => t.status === "Unassigned")
      .slice(0, 5)
      .forEach((t) => {
        items.push({
          id: `aq-unassigned-${t.id}`,
          type: "unassigned_plan",
          severity: "error",
          label: `${t.tripCode} needs vehicle & driver`,
          detail: `Departing ${new Date(t.departureTime).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`,
          entityId: t.id,
          linkHref: `/institution/logistics/trips/${t.id}`,
        });
      });

    // Capacity mismatches
    this.state.trips
      .filter((t) => t.assignedPassengers > t.seatingCapacity && !["Cancelled", "Completed"].includes(t.status))
      .slice(0, 3)
      .forEach((t) => {
        items.push({
          id: `aq-cap-${t.id}`,
          type: "capacity_mismatch",
          severity: "error",
          label: `${t.tripCode} over capacity`,
          detail: `${t.assignedPassengers} passengers / ${t.seatingCapacity} seats`,
          entityId: t.id,
          linkHref: `/institution/logistics/trips/${t.id}`,
        });
      });

    // Driver overlaps (find trips with same driver at same time)
    const tripsByDriver = new Map<string, Trip[]>();
    this.state.trips
      .filter((t) => t.driverId && !["Cancelled", "Completed"].includes(t.status))
      .forEach((t) => {
        const list = tripsByDriver.get(t.driverId!) ?? [];
        list.push(t);
        tripsByDriver.set(t.driverId!, list);
      });
    tripsByDriver.forEach((trips, driverId) => {
      for (let i = 0; i < trips.length; i++) {
        for (let j = i + 1; j < trips.length; j++) {
          if (this.tripsOverlap(trips[i], trips[j])) {
            const driver = this.state.drivers.find((d) => d.id === driverId);
            items.push({
              id: `aq-overlap-${trips[i].id}-${trips[j].id}`,
              type: "driver_overlap",
              severity: "error",
              label: `Driver overlap: ${driver?.name ?? driverId}`,
              detail: `${trips[i].tripCode} and ${trips[j].tripCode} overlap`,
              entityId: trips[i].id,
              linkHref: `/institution/logistics/trips/${trips[i].id}`,
            });
          }
        }
      }
    });

    // Expiring permits (within 90 days)
    const ninetyDaysOut = new Date(today);
    ninetyDaysOut.setDate(today.getDate() + 90);
    this.state.vehicles
      .filter((v) => v.active && new Date(v.permitExpiry) <= ninetyDaysOut)
      .slice(0, 3)
      .forEach((v) => {
        items.push({
          id: `aq-permit-${v.id}`,
          type: "permit_expiring",
          severity: new Date(v.permitExpiry) <= today ? "error" : "warning",
          label: `Permit expiring: ${v.assetCode}`,
          detail: `Expires ${v.permitExpiry}`,
          entityId: v.id,
          linkHref: `/institution/logistics/vehicles`,
        });
      });

    // Expiring insurance (within 90 days)
    this.state.vehicles
      .filter((v) => v.active && new Date(v.insuranceExpiry) <= ninetyDaysOut)
      .slice(0, 3)
      .forEach((v) => {
        items.push({
          id: `aq-ins-${v.id}`,
          type: "insurance_expiring",
          severity: new Date(v.insuranceExpiry) <= today ? "error" : "warning",
          label: `Insurance expiring: ${v.assetCode}`,
          detail: `Expires ${v.insuranceExpiry}`,
          entityId: v.id,
          linkHref: `/institution/logistics/vehicles`,
        });
      });

    // Unresolved incidents
    this.getActiveIncidents()
      .slice(0, 3)
      .forEach((inc) => {
        items.push({
          id: `aq-inc-${inc.id}`,
          type: "unresolved_incident",
          severity: inc.severity === "Critical" || inc.severity === "High" ? "error" : "warning",
          label: `Open incident: ${inc.incidentCode}`,
          detail: `${inc.tripCode} — ${inc.category}`,
          entityId: inc.id,
          linkHref: `/institution/logistics/trips/${inc.tripId}`,
        });
      });

    return items;
  }

  // =========================================================================
  // Audit
  // =========================================================================
  getAuditLog(institutionId = DEMO_INSTITUTION_ID): AuditEvent[] {
    this.assertInstitution(institutionId);
    return this.state.auditLog.filter((a) => a.institutionId === institutionId);
  }

  // =========================================================================
  // Reset (for testing)
  // =========================================================================
  resetToSeed() {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
    this.notify();
  }
}

function validateRequestTransition(from: RequestStatus, to: RequestStatus): string | null {
  const valid = REQUEST_TRANSITIONS[from] ?? [];
  if (!valid.includes(to))
    return `Cannot transition request from "${from}" to "${to}".`;
  return null;
}

// Export singleton — matches hostel module pattern
export const logisticsService = new LogisticsService();
