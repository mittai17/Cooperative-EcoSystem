"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createInterview,
  type Api,
  type ApplicationSummary,
  type InterviewMode,
} from "@/lib/employer/workflow-api";
import { combineLocalDateTime, errorMessage, toDateInputValue, toTimeInputValue } from "@/lib/employer/workflow-format";

const DURATIONS = [30, 45, 60, 90, 120];

const DURATION_ITEMS = DURATIONS.map((d) => ({ label: `${d} minutes`, value: String(d) }));

/** Default booking slot: the next half-hour boundary at least two hours out. */
function nextSlot(): Date {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 2);
  date.setMinutes(date.getMinutes() >= 30 ? 30 : 0);
  return date;
}
const MODE_ITEMS = [
  { label: "Online", value: "online" },
  { label: "On-site", value: "onsite" },
];

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

interface InterviewFormProps {
  api: Api;
  application: ApplicationSummary;
  onScheduled: () => void;
}

export function InterviewForm({ api, application, onScheduled }: InterviewFormProps) {
  const [date, setDate] = useState(() => toDateInputValue(nextSlot()));
  const [time, setTime] = useState(() => toTimeInputValue(nextSlot()));
  const [duration, setDuration] = useState("60");
  const [mode, setMode] = useState<InterviewMode>("online");
  const [interviewer, setInterviewer] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    const iso = combineLocalDateTime(date, time);
    if (!iso) return "Pick a valid date and time.";
    if (new Date(iso).getTime() < Date.now()) return "The interview time is in the past.";
    if (mode === "online") {
      if (!meetingLink.trim()) return "Online interviews need a meeting link.";
      if (!isHttpUrl(meetingLink.trim())) return "Meeting link must start with http:// or https://.";
    }
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    const iso = combineLocalDateTime(date, time);
    if (!iso) return;
    setSubmitting(true);
    setError(null);
    try {
      await createInterview(api, {
        application_id: application.id,
        scheduled_at: iso,
        duration_minutes: Number(duration),
        mode,
        meeting_link: mode === "online" ? meetingLink.trim() : null,
        interviewer_name: interviewer.trim() || null,
        notes: notes.trim() || null,
      });
      onScheduled();
    } catch (err) {
      setError(errorMessage(err, "Could not schedule this interview. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <div className="grid grid-cols-1 gap-4 rounded-xl bg-muted/50 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Candidate</p>
          <p className="font-medium text-foreground">{application.candidate_name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Job</p>
          <p className="font-medium text-foreground">{application.job_title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="interview-date">Date</Label>
          <Input id="interview-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interview-time">Time</Label>
          <Input id="interview-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select items={DURATION_ITEMS} value={duration} onValueChange={(v) => v && setDuration(String(v))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Interview type</Label>
          <Select items={MODE_ITEMS} value={mode} onValueChange={(v) => v && setMode(v as InterviewMode)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="interview-interviewer">Interviewer</Label>
          <Input
            id="interview-interviewer"
            placeholder="e.g. Rajesh Mehta, HR Head"
            value={interviewer}
            onChange={(e) => setInterviewer(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interview-link" className={cn(mode === "online" && "after:ml-0.5 after:text-primary after:content-['*']")}>
            Meeting link
          </Label>
          <Input
            id="interview-link"
            type="url"
            placeholder={mode === "online" ? "https://meet.google.com/..." : "Not needed for on-site interviews"}
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            disabled={mode !== "online"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interview-notes">Notes for the panel</Label>
        <Textarea
          id="interview-notes"
          rows={4}
          placeholder="Agenda, documents to bring, or what to focus on."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" render={<Link href="/employer/interviews" />}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          Schedule Interview
        </Button>
      </div>
    </form>
  );
}
