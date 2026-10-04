/**
 * Hiring pipeline stages mapped to the backend application state machine
 * (`jobs._TRANSITIONS`). There is no "screening" state in the backend, so the
 * board does not invent one.
 */
export const PIPELINE_STAGES = [
  { key: "applied", label: "Applied", tone: "bg-primary/10 text-primary" },
  { key: "shortlisted", label: "Shortlisted", tone: "bg-primary/10 text-primary" },
  { key: "interview", label: "Interview", tone: "bg-warning/10 text-warning" },
  { key: "offered", label: "Offer", tone: "bg-warning/10 text-warning" },
  { key: "hired", label: "Hired", tone: "bg-success/10 text-success" },
  { key: "rejected", label: "Rejected", tone: "bg-destructive/10 text-destructive" },
] as const;

export const TERMINAL_STATUSES = ["hired", "rejected", "withdrawn", "applied_external"] as const;

export function stageLabel(status: string): string {
  if (status === "withdrawn") return "Withdrawn";
  if (status === "applied_external") return "Applied externally";
  return PIPELINE_STAGES.find((stage) => stage.key === status)?.label ?? status.replace(/_/g, " ");
}

export function stageTone(status: string): string {
  return PIPELINE_STAGES.find((stage) => stage.key === status)?.tone ?? "bg-muted text-muted-foreground";
}

export function isTerminal(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

/** Actions a recruiter can take from a stage. Interview and offer move through their own pages. */
export function stageActions(status: string): { shortlist: boolean; reject: boolean; schedule: boolean; offer: boolean } {
  return {
    shortlist: status === "applied",
    schedule: status === "shortlisted" || status === "interview",
    offer: status === "shortlisted" || status === "interview",
    reject: !isTerminal(status),
  };
}
