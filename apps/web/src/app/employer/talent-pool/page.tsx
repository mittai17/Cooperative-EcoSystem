"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Plus, UserRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AddCandidateDialog } from "@/components/employer/talent/add-candidate-dialog";
import { TalentEntryActions } from "@/components/employer/talent/talent-entry-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listTalentPool,
  TALENT_CATEGORIES,
  type TalentCategory,
  type TalentEntry,
} from "@/lib/employer/workflow-api";
import { errorMessage, formatDate } from "@/lib/employer/workflow-format";
import { useApi } from "@/lib/use-api";

const EMPTY_MESSAGE: Record<TalentCategory, string> = {
  saved: "No saved candidates yet.",
  high_potential: "No candidates marked high potential.",
  future_hiring: "No candidates earmarked for future hiring.",
  interviewed: "No interviewed candidates in the pool.",
  previously_hired: "No previously hired candidates in the pool.",
};

export default function TalentPoolPage() {
  const api = useApi();
  const [entries, setEntries] = useState<TalentEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [category, setCategory] = useState<TalentCategory>("saved");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listTalentPool(api);
      setEntries(data.entries);
    } catch (err) {
      setError(errorMessage(err, "Could not load the talent pool. Check your connection and try again."));
      setEntries(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const counts = useMemo(() => {
    const list = entries ?? [];
    return Object.fromEntries(TALENT_CATEGORIES.map((c) => [c.key, list.filter((e) => e.category === c.key).length])) as Record<TalentCategory, number>;
  }, [entries]);

  const visible = (entries ?? []).filter((e) => e.category === category);
  const savedIds = useMemo(() => new Set((entries ?? []).map((e) => e.trainee_id)), [entries]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Talent Pool"
        description="Keep promising candidates organised for future openings, interviews and rehiring."
        action={
          <Button onClick={() => setAdding(true)} disabled={entries === null}>
            <Plus />
            Add Candidate
          </Button>
        }
      />

      {notice && (
        <Alert>
          <CheckCircle2 className="text-success" />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Could not load the talent pool</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!error && entries === null && (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full max-w-xl" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!error && entries !== null && (
        <>
          <Tabs value={category} onValueChange={(v) => setCategory(v as TalentCategory)}>
            <TabsList className="h-auto flex-wrap">
              {TALENT_CATEGORIES.map((c) => (
                <TabsTrigger key={c.key} value={c.key}>
                  {c.label}
                  <span className="ml-1.5 text-xs text-muted-foreground">{counts[c.key]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {visible.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                <UserRound className="size-8 text-muted-foreground" />
                <p className="font-medium text-foreground">{EMPTY_MESSAGE[category]}</p>
                <p className="text-sm text-muted-foreground">Use Add Candidate to bring someone into this category.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {visible.map((entry) => (
                <Card key={entry.id} className="rounded-2xl border-border/60 shadow-sm">
                  <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{entry.candidate_name}</p>
                        {entry.match_score !== null && (
                          <Badge variant="outline">{entry.match_score}% match</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {[entry.occupation, entry.location].filter(Boolean).join(" · ") || "Profile details not shared"}
                      </p>
                      {entry.note && <p className="text-sm text-foreground/80">{entry.note}</p>}
                      <p className="text-xs text-muted-foreground">Added {formatDate(entry.added_at)}</p>
                    </div>
                    <TalentEntryActions
                      api={api}
                      entry={entry}
                      onChanged={(message) => {
                        setNotice(message);
                        void load();
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <AddCandidateDialog
        api={api}
        open={adding}
        defaultCategory={category}
        alreadySaved={savedIds}
        onOpenChange={setAdding}
        onAdded={(name) => {
          setNotice(`${name} added to the talent pool.`);
          void load();
        }}
      />
    </div>
  );
}
