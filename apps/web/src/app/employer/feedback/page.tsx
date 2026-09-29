"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Star } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ApiError, useApi } from "@/lib/use-api";

interface Hire {
  application_id: string;
  job_id: string;
  job_title: string;
  trainee_id: string;
  trainee_name: string;
  feedback_submitted: boolean;
}

interface FeedbackRecord {
  id: string;
  job_title: string;
  trainee_name: string;
  performance_rating: number;
  training_relevance: number;
  comments: string | null;
  created_at: string | null;
}

export default function FeedbackPage() {
  const api = useApi();
  const [hires, setHires] = useState<Hire[] | null>(null);
  const [past, setPast] = useState<FeedbackRecord[] | null>(null);
  const [selectedHire, setSelectedHire] = useState<string>("");
  const [rating, setRating] = useState(0);
  const [usefulSkills, setUsefulSkills] = useState("");
  const [missingSkills, setMissingSkills] = useState("");
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [hiresData, pastData] = await Promise.all([
        api.get<{ hires: Hire[] }>("/api/v1/jobs/hired"),
        api.get<{ feedback: FeedbackRecord[] }>("/api/v1/jobs/feedback/mine"),
      ]);
      setHires(hiresData.hires);
      setPast(pastData.feedback);
      const firstPending = hiresData.hires.find((h) => !h.feedback_submitted);
      if (firstPending) setSelectedHire(`${firstPending.job_id}::${firstPending.trainee_id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not reach the CoopSetu API");
      setHires([]);
      setPast([]);
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingHires = (hires ?? []).filter((h) => !h.feedback_submitted);

  async function submit() {
    if (!selectedHire) return;
    const [jobId, traineeId] = selectedHire.split("::");
    if (rating === 0) {
      setError("Pick a skill readiness rating before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/v1/jobs/feedback", {
        job_id: jobId,
        trainee_id: traineeId,
        useful_skills: usefulSkills.split(",").map((s) => s.trim()).filter(Boolean),
        missing_skills: missingSkills.split(",").map((s) => s.trim()).filter(Boolean),
        training_relevance: rating,
        performance_rating: rating,
        comments: comments.trim(),
      });
      setNotice("Feedback recorded. The trainee's Skill Passport and NCCT skill-demand analytics are now updated.");
      setUsefulSkills("");
      setMissingSkills("");
      setComments("");
      setRating(0);
      setSelectedHire("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not submit this feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employer Feedback"
        description="Provide feedback on hired candidates to help improve cooperative training programmes."
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {notice && (
        <Alert>
          <CheckCircle2 className="text-success" />
          <AlertTitle>Feedback submitted</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Submit New Feedback</CardTitle>
            <CardDescription>Your feedback directly influences future curriculum and skill-demand analytics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {hires === null ? (
              <Skeleton className="h-9 w-full" />
            ) : pendingHires.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No hired candidates are waiting on feedback right now. Hires appear here once an application
                reaches the &ldquo;Hired&rdquo; stage in Applications.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Hired Trainee</Label>
                  <Select
                    items={pendingHires.map((hire) => ({ label: `${hire.trainee_name} — ${hire.job_title}`, value: `${hire.job_id}::${hire.trainee_id}` }))}
                    value={selectedHire}
                    onValueChange={(v) => v && setSelectedHire(String(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a hire" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingHires.map((hire) => (
                        <SelectItem key={`${hire.job_id}::${hire.trainee_id}`} value={`${hire.job_id}::${hire.trainee_id}`}>
                          {hire.trainee_name} — {hire.job_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Skill Readiness Rating (1-5)</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" className="p-2 hover:bg-muted rounded-full" onClick={() => setRating(star)}>
                        <Star className={cn("w-6 h-6 transition-colors", star <= rating ? "fill-primary text-primary" : "text-muted-foreground")} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Most Useful Skills Demonstrated</Label>
                  <Input
                    placeholder="e.g. Ledger maintenance, Tally software..."
                    value={usefulSkills}
                    onChange={(e) => setUsefulSkills(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Missing or Weak Skills</Label>
                  <Input
                    placeholder="e.g. Digital payments, communication..."
                    value={missingSkills}
                    onChange={(e) => setMissingSkills(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Overall Performance Comments</Label>
                  <Textarea
                    placeholder="How has the candidate performed in their role so far?"
                    rows={4}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              </>
            )}
          </CardContent>
          {pendingHires.length > 0 && (
            <CardFooter>
              <Button onClick={submit} disabled={submitting || !selectedHire}>
                {submitting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                Submit Feedback
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Past Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {past === null ? (
              <Skeleton className="h-24 w-full" />
            ) : past.length === 0 ? (
              <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>
            ) : (
              past.map((item) => (
                <div key={item.id} className="border-b pb-4 last:border-0">
                  <p className="font-medium text-sm">{item.trainee_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.job_title}
                    {item.created_at ? ` • ${new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={cn("w-3 h-3", i <= item.performance_rating ? "fill-primary text-primary" : "text-muted-foreground")} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
