/**
 * Status badge components for logistics entities.
 * Always renders both colour AND text label — never colour-only.
 */
import type { TripStatus, PlanStatus, RequestStatus, IncidentStatus, PassengerStatus } from "@/lib/logistics/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Trip status
// ---------------------------------------------------------------------------
const TRIP_COLOUR: Record<TripStatus, string> = {
  Unassigned: "bg-muted text-muted-foreground",
  Assigned: "bg-tint-blue-bg text-tint-blue-fg",
  Ready: "bg-tint-violet-bg text-tint-violet-fg",
  Boarding: "bg-tint-amber-bg text-tint-amber-fg",
  Departed: "bg-tint-amber-bg text-tint-amber-fg",
  Arrived: "bg-tint-green-bg text-tint-green-fg",
  Completed: "bg-success/10 text-success",
  Delayed: "bg-warning/15 text-warning",
  Cancelled: "bg-destructive/10 text-destructive",
  Incident: "bg-destructive/15 text-destructive",
};

interface TripStatusBadgeProps {
  status: TripStatus;
  className?: string;
}

export function TripStatusBadge({ status, className }: TripStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(TRIP_COLOUR[status], "font-medium", className)}
      aria-label={`Trip status: ${status}`}
    >
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Plan status
// ---------------------------------------------------------------------------
const PLAN_COLOUR: Record<PlanStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  "Pending Approval": "bg-tint-amber-bg text-tint-amber-fg",
  Approved: "bg-tint-blue-bg text-tint-blue-fg",
  Published: "bg-success/10 text-success",
  "Needs Review": "bg-destructive/10 text-destructive",
  Cancelled: "bg-destructive/10 text-destructive",
  Completed: "bg-muted text-muted-foreground",
};

interface PlanStatusBadgeProps {
  status: PlanStatus;
  className?: string;
}

export function PlanStatusBadge({ status, className }: PlanStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(PLAN_COLOUR[status], "font-medium", className)}
      aria-label={`Plan status: ${status}`}
    >
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Request status
// ---------------------------------------------------------------------------
const REQUEST_COLOUR: Record<RequestStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Submitted: "bg-tint-blue-bg text-tint-blue-fg",
  "Under Review": "bg-tint-amber-bg text-tint-amber-fg",
  "More Info Required": "bg-tint-violet-bg text-tint-violet-fg",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
  Withdrawn: "bg-muted text-muted-foreground",
};

export function RequestStatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(REQUEST_COLOUR[status], "font-medium", className)}
      aria-label={`Request status: ${status}`}
    >
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Incident status
// ---------------------------------------------------------------------------
const INCIDENT_COLOUR: Record<IncidentStatus, string> = {
  Open: "bg-destructive/10 text-destructive",
  Assigned: "bg-tint-amber-bg text-tint-amber-fg",
  "In Progress": "bg-tint-blue-bg text-tint-blue-fg",
  Resolved: "bg-tint-green-bg text-tint-green-fg",
  Closed: "bg-muted text-muted-foreground",
};

export function IncidentStatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(INCIDENT_COLOUR[status], "font-medium", className)}
      aria-label={`Incident status: ${status}`}
    >
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Passenger status
// ---------------------------------------------------------------------------
const PASSENGER_COLOUR: Record<PassengerStatus, string> = {
  Expected: "bg-muted text-muted-foreground",
  Confirmed: "bg-tint-blue-bg text-tint-blue-fg",
  Boarded: "bg-tint-green-bg text-tint-green-fg",
  "No-show": "bg-destructive/10 text-destructive",
  "Dropped off": "bg-success/10 text-success",
  Cancelled: "bg-muted text-muted-foreground",
  Exception: "bg-tint-violet-bg text-tint-violet-fg",
};

export function PassengerStatusBadge({ status, className }: { status: PassengerStatus; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(PASSENGER_COLOUR[status], "font-medium", className)}
      aria-label={`Passenger status: ${status}`}
    >
      {status}
    </Badge>
  );
}
