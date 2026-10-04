"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateInterview, type Api, type Interview } from "@/lib/employer/workflow-api";
import { combineLocalDateTime, errorMessage, formatTime, toDateInputValue, toTimeInputValue } from "@/lib/employer/workflow-format";

interface RescheduleDialogProps {
  api: Api;
  interview: Interview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRescheduled: () => void;
}

export function RescheduleDialog({ api, interview, open, onOpenChange, onRescheduled }: RescheduleDialogProps) {
  const current = new Date(interview.scheduled_at);
  const [date, setDate] = useState(toDateInputValue(current));
  const [time, setTime] = useState(toTimeInputValue(current));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const iso = combineLocalDateTime(date, time);
    if (!iso) {
      setError("Pick a valid date and time.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateInterview(api, interview.id, { scheduled_at: iso });
      onOpenChange(false);
      onRescheduled();
    } catch (err) {
      setError(errorMessage(err, "Could not reschedule this interview."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule interview</DialogTitle>
          <DialogDescription>
            Currently {formatTime(interview.scheduled_at)} with {interview.candidate_name}. The candidate sees the new
            time once the interview is saved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reschedule-date">New date</Label>
            <Input id="reschedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reschedule-time">New time</Label>
            <Input id="reschedule-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Close
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Save new time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
