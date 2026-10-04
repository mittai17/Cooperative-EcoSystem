"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage, updateApplicationStatus, type EmployerApplicationDetail } from "@/lib/employer/candidates-api";
import { useApi } from "@/lib/use-api";

interface ApplicationNotesProps {
  application: EmployerApplicationDetail;
  onSaved: () => void;
  onError: (message: string) => void;
}

const MAX_NOTE = 5000;

/** Recruiter notes. Saved through the status endpoint with the current status, so no transition happens. */
export function ApplicationNotes({ application, onSaved, onError }: ApplicationNotesProps) {
  const api = useApi();
  const [draft, setDraft] = useState(application.employer_note ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = draft !== (application.employer_note ?? "");

  async function save() {
    setSaving(true);
    try {
      await updateApplicationStatus(api, application.id, { status: application.status, note: draft });
      onSaved();
    } catch (err) {
      onError(errorMessage(err, "Could not save the note."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        aria-label="Recruiter notes"
        placeholder="Add a private note about this candidate. Only your organisation can see it."
        value={draft}
        maxLength={MAX_NOTE}
        rows={5}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {draft.length}/{MAX_NOTE}
          {dirty ? " · unsaved changes" : ""}
        </span>
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          Save note
        </Button>
      </div>
    </div>
  );
}
