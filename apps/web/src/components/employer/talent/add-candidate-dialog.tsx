"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  addTalentEntry,
  searchCandidates,
  TALENT_CATEGORIES,
  type Api,
  type CandidateOption,
  type TalentCategory,
} from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";

const CATEGORY_ITEMS = TALENT_CATEGORIES.map((c) => ({ label: c.label, value: c.key }));

interface AddCandidateDialogProps {
  api: Api;
  open: boolean;
  defaultCategory: TalentCategory;
  alreadySaved: Set<string>;
  onOpenChange: (open: boolean) => void;
  onAdded: (name: string) => void;
}

export function AddCandidateDialog({ api, open, defaultCategory, alreadySaved, onOpenChange, onAdded }: AddCandidateDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CandidateOption[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CandidateOption | null>(null);
  const [category, setCategory] = useState<TalentCategory>(defaultCategory);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced candidate search through the existing candidates endpoint.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      const reset = window.setTimeout(() => {
        setResults(null);
        setSearchError(null);
      }, 0);
      return () => window.clearTimeout(reset);
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const data = await searchCandidates(api, term);
        if (!cancelled) setResults(data.candidates);
      } catch (err) {
        if (!cancelled) setSearchError(errorMessage(err, "Search failed. Try again."));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, api]);

  async function save() {
    if (!selected) {
      setError("Choose a candidate from the search results.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addTalentEntry(api, { trainee_id: selected.id, category, note: note.trim() || null });
      onAdded(selected.name);
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, "Could not add this candidate to the talent pool."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add candidate to talent pool</DialogTitle>
          <DialogDescription>Search verified candidates who have opted in to employer visibility.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="talent-search">Candidate name</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="talent-search"
                className="pl-8"
                placeholder="Type at least 2 letters"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(null);
                }}
              />
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {searching && <Skeleton className="h-12 w-full" />}
              {searchError && <p className="text-sm text-destructive">{searchError}</p>}
              {!searching && results && results.length === 0 && (
                <p className="text-sm text-muted-foreground">No candidates match that name.</p>
              )}
              {!searching &&
                results?.map((candidate) => {
                  const isSaved = alreadySaved.has(candidate.id);
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      disabled={isSaved}
                      onClick={() => setSelected(candidate)}
                      aria-pressed={selected?.id === candidate.id}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60",
                        selected?.id === candidate.id ? "border-primary bg-primary/5" : "border-border",
                      )}
                    >
                      <span>
                        <span className="block font-medium text-foreground">{candidate.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {[candidate.occupation, candidate.location].filter(Boolean).join(" · ") || "Location not shared"}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">{isSaved ? "Already saved" : candidate.match_score !== null ? `${candidate.match_score}% match` : ""}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select items={CATEGORY_ITEMS} value={category} onValueChange={(v) => v && setCategory(v as TalentCategory)}>
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

          <div className="space-y-2">
            <Label htmlFor="talent-note">Note (optional)</Label>
            <Textarea id="talent-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this candidate is worth keeping in touch with" />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !selected}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Add to pool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
