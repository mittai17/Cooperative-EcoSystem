"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Building2,
} from "lucide-react";
import { hostelService } from "@/lib/hostel/hostel-service";
import type { HostelRequest } from "@/lib/hostel/types";

interface RequestReviewModalProps {
  request: HostelRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllocateNow?: (traineeId: string) => void;
  onUpdated?: () => void;
}

export function RequestReviewModal({
  request,
  open,
  onOpenChange,
  onAllocateNow,
  onUpdated,
}: RequestReviewModalProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!request) return null;

  const handleApprove = () => {
    hostelService.approveRequest(request.id);
    onUpdated?.();
    onOpenChange(false);
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    hostelService.rejectRequest(request.id, rejectReason || "Seat capacity limitation in requested block");
    onUpdated?.();
    onOpenChange(false);
    setShowRejectInput(false);
  };

  const handleWaitlist = () => {
    hostelService.waitlistRequest(request.id);
    onUpdated?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-6 sm:rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Review Hostel Request &mdash; {request.requestId}
            </DialogTitle>
            <Badge
              variant="outline"
              className={
                request.status === "Approved"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : request.status === "Pending"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : request.status === "Allocated"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-muted text-muted-foreground"
              }
            >
              {request.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="p-3.5 bg-muted/20 rounded-xl border flex items-center gap-3">
            <div className="size-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
              {request.traineeName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">{request.traineeName}</h4>
              <p className="text-muted-foreground">
                {request.traineeCode} &bull; {request.programme} ({request.batch})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-muted-foreground block">Gender:</span>
              <span className="font-semibold text-foreground">{request.gender}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Submitted On:</span>
              <span className="font-semibold text-foreground">{request.submittedDate}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Requested Stay Period:</span>
              <span className="font-semibold text-foreground">
                {request.trainingStart} to {request.trainingEnd}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Requested Hostel:</span>
              <span className="font-semibold text-foreground">{request.requestedHostel}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Room Preference:</span>
              <span className="font-semibold text-foreground">{request.roomPreference}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">AC Preference:</span>
              <span className="font-semibold text-foreground">{request.acPreference ? "AC" : "Non-AC"}</span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <span className="text-muted-foreground block mb-1">Reason for Hostel Request:</span>
            <p className="p-2.5 bg-muted/30 rounded-lg text-foreground font-medium">
              {request.reason || "Official trainee nominated by cooperative institution requiring residential stay."}
            </p>
          </div>

          {request.specialRequirement && (
            <div>
              <span className="text-muted-foreground block mb-1">Special Requirements / Notes:</span>
              <p className="p-2.5 bg-amber-50 text-amber-900 rounded-lg border border-amber-200">
                {request.specialRequirement}
              </p>
            </div>
          )}

          {showRejectInput && (
            <div className="space-y-1.5 pt-2">
              <span className="text-destructive font-semibold">Reason for Rejection:</span>
              <Textarea
                placeholder="Enter remarks or grounds for rejecting request..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="h-20 text-xs"
              />
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleWaitlist}
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              <Clock className="size-3.5 mr-1" /> Waitlist
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="text-destructive border-red-300 hover:bg-red-50"
            >
              <XCircle className="size-3.5 mr-1" />
              {showRejectInput ? "Confirm Reject" : "Reject"}
            </Button>

            <Button
              size="sm"
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <CheckCircle2 className="size-3.5 mr-1" /> Approve
            </Button>

            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onAllocateNow?.(request.traineeId);
              }}
              className="bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              <UserPlus className="size-3.5 mr-1" /> Allocate Room
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
