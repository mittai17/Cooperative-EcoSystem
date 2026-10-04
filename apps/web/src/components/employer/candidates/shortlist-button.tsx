"use client";

import { useState } from "react";
import { Check, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveToTalentPool, updateApplicationStatus, errorMessage } from "@/lib/employer/candidates-api";
import { useApi } from "@/lib/use-api";

interface ShortlistButtonProps {
  candidateId: string;
  candidateName: string;
  /** Application to advance to "shortlisted" when the candidate has applied to this employer. */
  applicationId?: string | null;
  /** Current status of that application; the button is hidden once it is past "applied". */
  applicationStatus?: string | null;
  initiallySaved?: boolean;
  /** Demo data: nothing is written; the button confirms locally and reports via onDone. */
  demo?: boolean;
  size?: "default" | "sm";
  className?: string;
  onError?: (message: string) => void;
  onDone?: () => void;
}

/**
 * Shortlist = advance the linked application to "shortlisted" when one exists,
 * otherwise save the candidate to the talent pool as "saved". Both are real API writes.
 */
export function ShortlistButton({
  candidateId,
  candidateName,
  applicationId,
  applicationStatus,
  initiallySaved = false,
  demo = false,
  size = "default",
  className,
  onError,
  onDone,
}: ShortlistButtonProps) {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(initiallySaved ? "Saved" : null);

  const shortlistedAlready = applicationStatus !== undefined && applicationStatus !== null &&
    applicationStatus !== "applied" && applicationStatus !== "applied_external";

  async function shortlist() {
    if (demo) {
      setDone("Saved (demo)");
      onDone?.();
      return;
    }
    setBusy(true);
    try {
      if (applicationId && applicationStatus === "applied") {
        await updateApplicationStatus(api, applicationId, { status: "shortlisted" });
        setDone("Shortlisted");
      } else {
        await saveToTalentPool(api, candidateId);
        setDone("Saved");
      }
      onDone?.();
    } catch (err) {
      onError?.(`Could not shortlist ${candidateName}: ${errorMessage(err)}`);
    } finally {
      setBusy(false);
    }
  }

  if (shortlistedAlready) {
    return (
      <Button size={size} variant="secondary" disabled className={className}>
        <Check />
        {applicationStatus === "interview" ? "In interview" : "Shortlisted"}
      </Button>
    );
  }

  if (done) {
    return (
      <Button size={size} variant="secondary" disabled className={className}>
        <Check />
        {done}
      </Button>
    );
  }

  return (
    <Button size={size} onClick={shortlist} disabled={busy} className={className} aria-label={`Shortlist ${candidateName}`}>
      {busy ? <Loader2 className="animate-spin" /> : <Star />}
      Shortlist
    </Button>
  );
}
