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
import { updateOffer, type Api, type Offer } from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";

interface ConfirmOfferDialogProps {
  api: Api;
  offer: Offer;
  action: "send" | "withdraw";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (message: string) => void;
}

const COPY = {
  send: {
    title: "Send this offer?",
    description: (o: Offer) =>
      `The offer for ${o.candidate_name} (${o.job_title}) will be sent to the candidate. You can still withdraw it afterwards.`,
    confirm: "Send Offer",
    destructive: false,
    done: "Offer sent to the candidate.",
  },
  withdraw: {
    title: "Withdraw this offer?",
    description: (o: Offer) =>
      `The offer for ${o.candidate_name} will be withdrawn. The candidate will see it as withdrawn and cannot accept it.`,
    confirm: "Withdraw Offer",
    destructive: true,
    done: "Offer withdrawn.",
  },
} as const;

export function ConfirmOfferDialog({ api, offer, action, open, onOpenChange, onDone }: ConfirmOfferDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[action];

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await updateOffer(api, offer.id, { status: action === "send" ? "sent" : "withdrawn" });
      onOpenChange(false);
      onDone(copy.done);
    } catch (err) {
      setError(errorMessage(err, "The offer could not be updated. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description(offer)}</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Back
          </Button>
          <Button variant={copy.destructive ? "destructive" : "default"} onClick={confirm} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
