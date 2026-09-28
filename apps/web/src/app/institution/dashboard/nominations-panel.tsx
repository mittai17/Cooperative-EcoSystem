"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { institutionNominations } from "@/lib/mock-data/dashboards";

type NominationStatus = "Pending" | "Approved" | "Rejected";

const nominationTone: Record<NominationStatus, string> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function NominationsPanel() {
  const [nominations, setNominations] = useState(
    institutionNominations.map((n) => ({ ...n, status: n.status as NominationStatus }))
  );

  function updateStatus(id: string, status: NominationStatus) {
    setNominations((prev) => prev.map((n) => (n.id === id ? { ...n, status } : n)));
  }

  return (
    <div className="flex flex-col gap-3">
      {nominations.map((nomination) => (
        <div key={nomination.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-tint-red-bg text-tint-red-fg">
                {initials(nomination.trainee)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{nomination.trainee}</p>
              <p className="truncate text-xs text-muted-foreground">{nomination.programme}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {nomination.status === "Pending" ? (
              <>
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label={`Approve ${nomination.trainee}`}
                  onClick={() => updateStatus(nomination.id, "Approved")}
                >
                  <Check className="size-3.5" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label={`Reject ${nomination.trainee}`}
                  onClick={() => updateStatus(nomination.id, "Rejected")}
                >
                  <X className="size-3.5" />
                </Button>
              </>
            ) : (
              <Badge className={nominationTone[nomination.status]} variant="secondary">
                {nomination.status}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
