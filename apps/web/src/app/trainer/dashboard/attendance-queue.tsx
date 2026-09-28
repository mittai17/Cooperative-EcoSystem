"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trainerAttendanceQueue } from "@/lib/mock-data/dashboards";

type AttendanceStatus = "Not marked" | "Marked";

export function AttendanceQueue() {
  const [queue, setQueue] = useState(
    trainerAttendanceQueue.map((item) => ({ ...item, status: item.status as AttendanceStatus }))
  );

  return (
    <div className="flex flex-col gap-3">
      {queue.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
          <div className="flex items-start gap-3">
            <span className="icon-tile-red size-9">
              <ClipboardCheck className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{item.classTitle}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
          {item.status === "Marked" ? (
            <Badge className="bg-success/10 text-success" variant="secondary">
              <CheckCircle2 className="size-3.5" /> Marked
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "Marked" } : q)))}
            >
              Mark attendance
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
