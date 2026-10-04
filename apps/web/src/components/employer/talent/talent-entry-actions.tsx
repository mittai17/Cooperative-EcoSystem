"use client";

import { useState } from "react";
import { ArrowRightLeft, Loader2, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  removeTalentEntry,
  TALENT_CATEGORIES,
  updateTalentEntry,
  type Api,
  type TalentCategory,
  type TalentEntry,
} from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";

const CATEGORY_ITEMS = TALENT_CATEGORIES.map((c) => ({ label: c.label, value: c.key }));

interface TalentEntryActionsProps {
  api: Api;
  entry: TalentEntry;
  onChanged: (message: string) => void;
}

/** Move Category and Remove for one talent pool entry. Both go through a dialog so a stray click cannot change the pool. */
export function TalentEntryActions({ api, entry, onChanged }: TalentEntryActionsProps) {
  const [mode, setMode] = useState<"move" | "remove" | null>(null);
  const [target, setTarget] = useState<TalentCategory>(entry.category);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (busy) return;
    setMode(null);
    setError(null);
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      if (mode === "move") {
        if (target === entry.category) {
          setMode(null);
          return;
        }
        await updateTalentEntry(api, entry.id, { category: target });
        const label = TALENT_CATEGORIES.find((c) => c.key === target)?.label ?? target;
        onChanged(`${entry.candidate_name} moved to ${label}.`);
      } else {
        await removeTalentEntry(api, entry.id);
        onChanged(`${entry.candidate_name} removed from the talent pool.`);
      }
      setMode(null);
    } catch (err) {
      setError(errorMessage(err, "The talent pool could not be updated. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" onClick={() => { setTarget(entry.category); setMode("move"); }}>
          <ArrowRightLeft />
          Move Category
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setMode("remove")}>
          <Trash2 />
          Remove
        </Button>
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          {mode === "move" ? (
            <>
              <DialogHeader>
                <DialogTitle>Move {entry.candidate_name}</DialogTitle>
                <DialogDescription>Choose the category this candidate belongs in.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select items={CATEGORY_ITEMS} value={target} onValueChange={(v) => v && setTarget(v as TalentCategory)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Remove {entry.candidate_name}?</DialogTitle>
                <DialogDescription>
                  This removes the candidate from your talent pool only. Their application history is not affected.
                </DialogDescription>
              </DialogHeader>
            </>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button variant={mode === "remove" ? "destructive" : "default"} onClick={confirm} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {mode === "remove" ? "Remove" : "Save category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
