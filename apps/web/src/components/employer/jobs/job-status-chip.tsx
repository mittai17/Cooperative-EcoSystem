import { cn } from "@/lib/utils";
import { JOB_STATUS_LABEL, type JobStatus } from "@/lib/employer/jobs-api";
import { STATUS_CHIP_CLASS } from "./format";

export function JobStatusChip({ status, className }: { status: JobStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_CHIP_CLASS[status],
        className,
      )}
    >
      {JOB_STATUS_LABEL[status]}
    </span>
  );
}
