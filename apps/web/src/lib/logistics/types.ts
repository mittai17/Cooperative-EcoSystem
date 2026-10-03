/**
 * CoopSetu AI — Logistics Management Module
 * TypeScript types, status enums, and business-rule constants.
 *
 * Status transitions are enforced server-side; the client enforces them only
 * for optimistic UI. Downstream modules (Timetable, Programme, Hostel) are
 * consumed via read-only adapter interfaces so mocks can be swapped for real
 * API calls without touching page components.
 */

// ---------------------------------------------------------------------------
// Enumerations (status models from spec §5)
// ---------------------------------------------------------------------------

export type RequestStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "More Info Required"
  | "Approved"
  | "Rejected"
  | "Withdrawn";

export type PlanStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Published"
  | "Needs Review"
  | "Cancelled"
  | "Completed";

export type TripStatus =
  | "Unassigned"
  | "Assigned"
  | "Ready"
  | "Boarding"
  | "Departed"
  | "Arrived"
  | "Completed"
  | "Delayed"
  | "Cancelled"
  | "Incident";

export type PassengerStatus =
  | "Expected"
  | "Confirmed"
  | "Boarded"
  | "No-show"
  | "Dropped off"
  | "Cancelled"
  | "Exception";

export type IncidentStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Resolved"
  | "Closed";

export type IncidentSeverity = "Low" | "Medium" | "High" | "Critical";

export type IncidentCategory =
  | "Vehicle Breakdown"
  | "Driver Issue"
  | "Passenger Issue"
  | "Route Obstruction"
  | "Medical"
  | "Delay"
  | "Safety"
  | "Other";

export type VehicleType = "12-seat Van" | "22-seat Minibus" | "40-seat Bus";

export type VehicleStatus = "Available" | "Assigned" | "In Use" | "Maintenance" | "Inactive";

export type DriverAvailability = "Available" | "Assigned" | "On Leave" | "Inactive";

export type TransportType =
  | "Pickup"
  | "Drop"
  | "Transfer"
  | "Event Transport"
  | "Exam Transport"
  | "Station Pickup"
  | "Hostel Transfer";

export type ExpenseCategory =
  | "Hire"
  | "Fuel"
  | "Toll"
  | "Parking"
  | "Allowance"
  | "Repair"
  | "Other";

export type ExpenseApprovalStatus = "Pending" | "Approved" | "Rejected";

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface Institution {
  id: string;
  name: string;
  code: string;
  campuses: Campus[];
  timezone: string; // IANA tz, e.g. "Asia/Kolkata"
}

export interface Campus {
  id: string;
  institutionId: string;
  name: string;
  location: string;
}

export interface Vehicle {
  id: string;
  /** Unique registration / asset code shown to users */
  assetCode: string;
  registrationNumber: string;
  type: VehicleType;
  seatingCapacity: number;
  accessibilityFeatures: string[];
  vendorId: string | null;
  /** ISO date */
  permitExpiry: string;
  /** ISO date */
  insuranceExpiry: string;
  maintenanceStatus: VehicleStatus;
  active: boolean;
  campusId: string;
  institutionId: string;
}

export interface Driver {
  id: string;
  name: string;
  /** Shown to coordinator only; never exposed to trainees */
  contactPhone: string;
  /** Licence reference code, not the full licence number */
  licenceRef: string;
  /** ISO date */
  licenceExpiry: string;
  vendorId: string | null;
  availability: DriverAvailability;
  active: boolean;
  institutionId: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPhone: string;
  contractRef: string;
  active: boolean;
}

export interface Route {
  id: string;
  name: string;
  institutionId: string;
  campusId: string;
  description: string;
  stops: RouteStop[];
}

export interface RouteStop {
  id: string;
  routeId: string;
  sequence: number;
  locationName: string;
  /** Address or landmark */
  address: string;
  /** Pickup window start, HH:mm */
  pickupWindowStart: string;
  /** Pickup window end, HH:mm */
  pickupWindowEnd: string;
  instructions: string;
  accessiblePickup: boolean;
}

export interface TransportPlan {
  id: string;
  institutionId: string;
  campusId: string;
  title: string;
  /** "programme" | "exam" | "event" | "manual" */
  linkedType: string;
  /** Stable ID of the linked entity */
  linkedId: string | null;
  /** Human-readable name, for display only */
  linkedLabel: string;
  serviceDate: string; // ISO date
  transportType: TransportType;
  origin: string;
  destination: string;
  passengerEstimate: number;
  coordinatorId: string;
  coordinatorName: string;
  status: PlanStatus;
  hasReturnTrip: boolean;
  accessibilityNeeds: boolean;
  specialInstructions: string;
  costCentre: string;
  vendorId: string | null;
  internalNotes: string;
  createdAt: string; // ISO datetime
  updatedAt: string;
  /** Set when plan is moved to Needs Review due to linked event change */
  needsReviewReason: string | null;
}

export interface Trip {
  id: string;
  planId: string;
  tripCode: string;
  departureTime: string; // ISO datetime
  arrivalTime: string;
  origin: string;
  destination: string;
  routeId: string | null;
  vehicleId: string | null;
  driverId: string | null;
  coordinatorId: string;
  coordinatorName: string;
  seatingCapacity: number;
  assignedPassengers: number;
  status: TripStatus;
  /** Populated when TripStatus is Delayed */
  delayMinutes: number | null;
  /** Confirmed ETA when delayed */
  confirmedEta: string | null;
  institutionId: string;
  campusId: string;
  isReturnTrip: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PassengerAssignment {
  id: string;
  tripId: string;
  traineeId: string;
  traineeName: string;
  traineeCode: string;
  programmeId: string;
  programmeTitle: string;
  batchId: string;
  batchCode: string;
  pickupStopId: string | null;
  pickupStopName: string | null;
  status: PassengerStatus;
  boardedAt: string | null;
  droppedAt: string | null;
  /** What the coordinator is permitted to use to contact this passenger */
  permittedContactMethod: "email" | "phone" | "none";
}

export interface TransportRequest {
  id: string;
  requestCode: string;
  requesterId: string;
  requesterName: string;
  requesterRole: "trainer" | "institution";
  eventId: string | null;
  eventLabel: string;
  requestedDate: string; // ISO date
  departureTime: string;
  origin: string;
  destination: string;
  passengerEstimate: number;
  reason: string;
  accessibilityNeeds: boolean;
  notes: string;
  approvalStatus: RequestStatus;
  decisionNote: string;
  decidedBy: string | null;
  decidedAt: string | null;
  linkedPlanId: string | null;
  createdAt: string;
  updatedAt: string;
  institutionId: string;
}

export interface Incident {
  id: string;
  incidentCode: string;
  tripId: string;
  tripCode: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  reporterName: string;
  reporterRole: string;
  ownerName: string | null;
  description: string;
  locationDescription: string;
  occurredAt: string; // ISO datetime
  status: IncidentStatus;
  /** Append-only action log entries */
  actionLog: IncidentAction[];
  resolutionSummary: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  institutionId: string;
}

export interface IncidentAction {
  id: string;
  timestamp: string;
  actor: string;
  note: string;
}

export interface TripExpense {
  id: string;
  tripId: string;
  planId: string;
  category: ExpenseCategory;
  amountInr: number;
  vendorName: string;
  receiptRef: string;
  payerName: string;
  approvalStatus: ExpenseApprovalStatus;
  recordedAt: string;
  approvedBy: string | null;
  institutionId: string;
}

export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  actor: string;
  actorRole: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string;
  createdAt: string;
  institutionId: string;
}

// ---------------------------------------------------------------------------
// Aggregate / view types used by pages
// ---------------------------------------------------------------------------

export interface TripWithDetails extends Trip {
  vehicleAssetCode: string | null;
  vehicleRegistration: string | null;
  vehicleType: VehicleType | null;
  driverName: string | null;
  routeName: string | null;
  planTitle: string;
}

export interface LogisticsOverviewStats {
  tripsToday: number;
  pendingRequests: number;
  vehiclesAvailable: number;
  passengersExpected: number;
  activeIncidents: number;
  tripsNeedingAssignment: number;
}

export interface ActionQueueItem {
  id: string;
  type:
    | "unassigned_plan"
    | "capacity_mismatch"
    | "driver_overlap"
    | "permit_expiring"
    | "insurance_expiring"
    | "late_trip"
    | "unresolved_incident";
  severity: "warning" | "error";
  label: string;
  detail: string;
  entityId: string;
  linkHref: string;
}

// ---------------------------------------------------------------------------
// Downstream integration adapter interfaces (mocked in Phase 1)
// ---------------------------------------------------------------------------

export interface ProgrammeRef {
  id: string;
  code: string;
  title: string;
  institutionId: string;
  startDate: string;
  endDate: string;
  campusId: string;
}

export interface BatchRef {
  id: string;
  programmeId: string;
  code: string;
  size: number;
  campusId: string;
}

export interface TimetableSessionRef {
  id: string;
  batchId: string;
  startDatetime: string;
  endDatetime: string;
  venue: string;
  campusId: string;
  eventChangeFlag: boolean;
}

export interface HostelRef {
  id: string;
  name: string;
  campusId: string;
  location: string;
}

/** Adapter interface: swap the mock implementation for real API calls in Phase 4 */
export interface LogisticsIntegrationAdapter {
  getProgrammes(institutionId: string): Promise<ProgrammeRef[]>;
  getBatches(programmeId: string): Promise<BatchRef[]>;
  getTimetableSessions(batchId: string): Promise<TimetableSessionRef[]>;
  getHostels(campusId: string): Promise<HostelRef[]>;
}
