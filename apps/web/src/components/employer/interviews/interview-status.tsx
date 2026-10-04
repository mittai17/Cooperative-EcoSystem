import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InterviewDecision, InterviewStatus } from "@/lib/employer/workflow-api";

const STATUS_TONE: Record<InterviewStatus, string> = {
  scheduled: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<InterviewStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

const DECISION_TONE: Record<InterviewDecision, string> = {
  proceed: "bg-success/10 text-success",
  hold: "bg-warning/10 text-warning",
  reject: "bg-destructive/10 text-destructive",
};

const DECISION_LABEL: Record<InterviewDecision, string> = {
  proceed: "Proceed",
  hold: "Hold",
  reject: "Reject",
};

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  return <Badge className={cn("border-0", STATUS_TONE[status])}>{STATUS_LABEL[status]}</Badge>;
}

export function InterviewDecisionBadge({ decision }: { decision: InterviewDecision | null }) {
  if (!decision) return <span className="text-xs text-muted-foreground">No decision yet</span>;
  return <Badge className={cn("border-0", DECISION_TONE[decision])}>Decision: {DECISION_LABEL[decision]}</Badge>;
}
