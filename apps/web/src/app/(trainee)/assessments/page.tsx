"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { traineeUpcomingAssessments } from "@/lib/mock-data/dashboards";
import { enqueueAssessmentSubmission, useOfflineSync } from "@/lib/offline/sync-manager";
import { Calendar, CheckCircle, CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentItem {
  id: string;
  title: string;
  programme: string;
  dueDate: string;
  type: string;
  score?: number;
  completed?: boolean;
}

export default function AssessmentsPage() {
  const [tab, setTab] = useState("Upcoming");
  const { isOnline } = useOfflineSync();
  const [assessments, setAssessments] = useState<AssessmentItem[]>(traineeUpcomingAssessments);

  // Active quiz modal
  const [activeQuiz, setActiveQuiz] = useState<AssessmentItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleStart = (item: AssessmentItem) => {
    setActiveQuiz(item);
    setSelectedOption(null);
    setSubmitted(false);
  };

  const handleSubmitAssessment = async () => {
    if (!activeQuiz || selectedOption === null) return;

    const score = selectedOption === 1 ? 92 : 75;

    // Enqueue assessment submission
    await enqueueAssessmentSubmission(activeQuiz.id, score, {
      selectedOption,
      programme: activeQuiz.programme,
    });

    setSubmitted(true);
    setAssessments((prev) =>
      prev.map((a) => (a.id === activeQuiz.id ? { ...a, score, completed: true } : a))
    );

    setTimeout(() => {
      setActiveQuiz(null);
      setSubmitted(false);
    }, 1500);
  };

  const upcomingList = assessments.filter((a) => !a.completed);
  const completedList = assessments.filter((a) => a.completed);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assessments Hub"
        description="Take your module quizzes and proficiency evaluations online or offline. Submissions synchronize automatically."
      />

      <div className="flex items-center gap-2 border-b border-border pb-2">
        {["Upcoming", "Completed", "Missed"].map((t) => (
          <Button
            key={t}
            variant={t === tab ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab(t)}
          >
            {t}
            {t === "Completed" && completedList.length > 0 && (
              <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600">
                {completedList.length}
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tab === "Upcoming" && upcomingList.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.programme}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{a.type}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" /> Due: {a.dueDate}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => handleStart(a)}>Start Assessment</Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {tab === "Completed" && (
          completedList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No completed assessments yet. Start an upcoming assessment to test your knowledge!
            </div>
          ) : (
            completedList.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.programme}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{a.type}</Badge>
                      <span className="text-xs text-emerald-600 font-medium">Passed</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="size-5" />
                    <span className="font-bold text-base">{a.score || 88}%</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        )}

        {tab === "Missed" && (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No missed assessments. Keep up the good work!
          </div>
        )}
      </div>

      {/* Assessment Question Modal */}
      <Dialog open={Boolean(activeQuiz)} onOpenChange={(open) => !open && setActiveQuiz(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">{activeQuiz?.title}</DialogTitle>
              {!isOnline && (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                  Offline Exam
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs">
              {activeQuiz?.programme} • Complete the question below to submit your evaluation.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="size-8" />
              </div>
              <h4 className="font-bold text-foreground">Assessment Submitted!</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {isOnline
                  ? "Evaluated and saved to learner profile."
                  : "Saved to IndexedDB sync queue. Will sync automatically upon reconnection."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl bg-muted/40 p-3 border border-border">
                <p className="text-sm font-medium text-foreground">
                  Which financial document must be audited annually and submitted to the Registrar of Cooperative Societies?
                </p>
              </div>

              <div className="space-y-2">
                {[
                  "Internal Informal Memorandum",
                  "Statutory Balance Sheet & Profit/Loss Statement",
                  "Marketing Promotional Pamphlet",
                  "Draft Proposal of Vendor Quotations",
                ].map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedOption(idx)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border text-sm transition-all flex items-center justify-between",
                      selectedOption === idx
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <span>{option}</span>
                    {selectedOption === idx && <CheckCircle2 className="size-4" />}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setActiveQuiz(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitAssessment} disabled={selectedOption === null} className="gap-1.5">
                  <Send className="size-4" />
                  Submit Evaluation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
