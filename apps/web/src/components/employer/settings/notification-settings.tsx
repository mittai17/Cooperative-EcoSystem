"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  updateNotificationPrefs,
  type Api,
  type NotificationPrefs,
} from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";

const PREF_ROWS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: "interview_reminders", label: "Interview reminders", hint: "A reminder before each scheduled interview." },
  { key: "new_application", label: "New applications", hint: "When a candidate applies to one of your jobs." },
  { key: "candidate_response", label: "Candidate responses", hint: "When a candidate accepts, declines or replies to an offer." },
  { key: "job_deadline", label: "Job deadlines", hint: "When an open job is close to its application deadline." },
];

interface NotificationSettingsProps {
  api: Api;
  initial: NotificationPrefs;
}

/** Each toggle saves on change. A failed save rolls the switch back and shows the error. */
export function NotificationSettings({ api, initial }: NotificationSettingsProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [pending, setPending] = useState<keyof NotificationPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(key: keyof NotificationPrefs, value: boolean) {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setPending(key);
    setError(null);
    try {
      await updateNotificationPrefs(api, next);
    } catch (err) {
      setPrefs(previous);
      setError(errorMessage(err, "That preference could not be saved. It has been reset."));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <ul className="divide-y divide-border/60">
        {PREF_ROWS.map((row) => {
          const id = `pref-${row.key}`;
          return (
            <li key={row.key} className="flex items-center justify-between gap-4 py-4">
              <div>
                <Label htmlFor={id} className="text-sm font-medium">
                  {row.label}
                </Label>
                <p className="text-xs text-muted-foreground">{row.hint}</p>
              </div>
              <Switch
                id={id}
                checked={prefs[row.key]}
                disabled={pending !== null}
                onCheckedChange={(checked) => void toggle(row.key, checked)}
                aria-label={row.label}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
