import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OfferStatus } from "@/lib/employer/workflow-api";

const TONE: Record<OfferStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  accepted: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
  expired: "bg-warning/10 text-warning",
  withdrawn: "bg-muted text-muted-foreground line-through",
};

const LABEL: Record<OfferStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  withdrawn: "Withdrawn",
};

export function OfferStatusChip({ status }: { status: OfferStatus }) {
  return <Badge className={cn("border-0", TONE[status])}>{LABEL[status]}</Badge>;
}
