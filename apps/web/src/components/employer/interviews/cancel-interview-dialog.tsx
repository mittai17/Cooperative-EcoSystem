"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateInterview, type Api, type Interview } from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";

interface CancelInterviewDialogProps {
  api: Api;
  interview: Interview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled: () => void;
}

export function CancelInterviewDialog({ api, interview, open, onOpenChange, onCancelled }: CancelInterviewDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await updateInterview(api, interview.id, { status: "cancelled" });
      onOpenChange(false);
      onCancelled();
    } catch (err) {
      setError(errorMessage(err, "Could not cancel this interview. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this interview?</DialogTitle>
          <DialogDescription>
            The interview with {interview.candidate_name} for {interview.job_title} will be marked as cancelled. The
            candidate is not notified automatically from this screen.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Keep interview
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Cancel interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
