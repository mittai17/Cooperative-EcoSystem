"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DikshaContentPlayer, type DikshaPlayerResource, type PlayerEventPayload } from "@/components/lms/DikshaContentPlayer";

interface PageProps {
  params: Promise<{ contentId: string }>;
}

export default function LearningPlayerPage({ params }: PageProps) {
  const { contentId } = use(params);
  const router = useRouter();

  const [resource, setResource] = useState<DikshaPlayerResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressPct, setProgressPct] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  // Assessment State
  const [assessment, setAssessment] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);

  // Notes state
  const [userNotes, setUserNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  // Fetch content and progress
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        // 1. Fetch resource metadata
        const resResp = await fetch(`${apiBase}/api/v1/content/diksha/read/${contentId}`);
        if (resResp.ok) {
          const data = await resResp.json();
          setResource({
            identifier: data.external_id,
            title: data.title,
            contentType: data.content_type,
            mimeType: data.mime_type,
            artifactUrl: data.artifact_url,
            streamingUrl: data.streaming_url,
            playerUrl: data.player_url,
            license: data.license,
            licenseStatus: data.license_status,
            attribution: data.attribution,
            creator: data.author,
            organization: data.organization,
            embeddingAllowed: data.embedding_allowed,
          });
        } else {
          // Fallback demo resource
          setResource({
            identifier: contentId,
            title: "Cooperative Management Fundamentals & Governance",
            contentType: "video",
            artifactUrl: "https://files.odev.oci.diksha.gov.in/sample.mp4",
            license: "CC BY-NC 4.0",
            licenseStatus: "NON_COMMERCIAL_ONLY",
            attribution: "Source: DIKSHA National Learning Gateway · NCCT",
            embeddingAllowed: true,
          });
        }

        // 2. Fetch user progress
        const progResp = await fetch(`${apiBase}/api/v1/learning/progress/${contentId}`);
        if (progResp.ok) {
          const pdata = await progResp.json();
          setProgressPct(pdata.completion_percentage || 0);
        }

        // 3. Fetch assessment
        const assessResp = await fetch(`${apiBase}/api/v1/learning/content/${contentId}/assessment`);
        if (assessResp.ok) {
          const adata = await assessResp.json();
          setAssessment(adata);
        }
      } catch (err) {
        console.error("Failed to load learning data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [contentId]);

  // Sync progress to backend
  async function handlePlayerProgress(payload: PlayerEventPayload) {
    setProgressPct(payload.percentage);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiBase}/api/v1/learning/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: contentId,
          last_position: payload.position,
          completion_percentage: payload.percentage,
          time_spent_seconds: 5,
          completed: payload.percentage >= 90,
        }),
      });
    } catch {
      // offline/silent sync
    }
  }

  // Handle Assessment Submit
  async function handleAssessmentSubmit() {
    setEvaluating(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const resp = await fetch(`${apiBase}/api/v1/learning/content/${contentId}/evaluate-assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          time_spent_seconds: 60,
        }),
      });
      if (resp.ok) {
        const result = await resp.json();
        setEvalResult(result);
        if (result.passed) {
          setProgressPct(100);
        }
      }
    } catch (err) {
      console.error("Evaluation failed:", err);
    } finally {
      setEvaluating(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[420px] w-full rounded-2xl" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/trainee/learn"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition"
          >
            <ArrowLeft className="size-4" /> Back to Learn Catalog
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-xs font-medium text-slate-500 truncate max-w-md">
            CoopSetu AI Learning Pathway · DIKSHA Certified
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <span>Lesson Progress:</span>
            <span className="font-bold text-primary">{progressPct}%</span>
            <div className="w-24">
              <Progress value={progressPct} className="h-2" />
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8"
            onClick={() => setActiveTab("assessment")}
          >
            <HelpCircle className="size-3.5 mr-1 text-primary" /> Take Assessment
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Title & Metadata Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                DIKSHA National Curriculum
              </Badge>
              {resource?.license && (
                <Badge variant="outline" className="text-xs">
                  {resource.license}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {resource?.title || "Educational Lesson"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {resource?.attribution || "NCCT / Ministry of Cooperation Knowledge Base"}
            </p>
          </div>

          {/* Previous / Next Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => router.push("/trainee/learn")}
            >
              <ChevronLeft className="size-3.5 mr-1" /> Previous
            </Button>
            <Button
              size="sm"
              className="text-xs h-8"
              onClick={() => setActiveTab("assessment")}
            >
              Next <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* Unified In-App Content Player */}
        {resource && (
          <DikshaContentPlayer
            resource={resource}
            initialPosition={0}
            onProgress={handlePlayerProgress}
            onComplete={() => {
              setProgressPct(100);
              setActiveTab("assessment");
            }}
          />
        )}

        {/* Tabbed Learning Workspace */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-md bg-slate-200/70 dark:bg-slate-800">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
            <TabsTrigger value="discussion" className="text-xs">Discussion</TabsTrigger>
            <TabsTrigger value="assessment" className="text-xs font-semibold text-primary">
              Assessment
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About this Resource</CardTitle>
                <CardDescription>
                  Learning objectives and statutory alignment under NCCT guidelines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  This course module is integrated directly from DIKSHA, India&apos;s National Digital
                  Platform for Teachers and Learners. It provides foundational and practical competencies
                  designed for primary cooperative societies, agricultural federations, and dairy unions.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-xs text-slate-500 font-medium">Target Competencies</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      Cooperative Operations & Statutory Compliance
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-xs text-slate-500 font-medium">Skill Passport Benefit</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      +25 Skill Passport Points upon Assessment Pass
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Study Notes</CardTitle>
                <CardDescription>Keep private key takeaways and study reminders for this lesson.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Record definitions, PACS bylaws notes, or lecture reminders..."
                  rows={6}
                  value={userNotes}
                  onChange={(e) => {
                    setUserNotes(e.target.value);
                    setNotesSaved(false);
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {notesSaved ? "Saved to your Trainee Notebook" : "Unsaved edits"}
                  </span>
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={() => setNotesSaved(true)}
                  >
                    Save Notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discussion Tab */}
          <TabsContent value="discussion" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cooperative Peer Discussion</CardTitle>
                <CardDescription>Collaborate with fellow trainees and certified NCCT mentors.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-sm">
                  <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    RD
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Ramesh Deshmukh (Trainer)
                      </span>
                      <span>Yesterday</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      Remember to review how statutory reserves are computed before taking the
                      post-lesson knowledge assessment!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessment & Certification Tab */}
          <TabsContent value="assessment" className="mt-4">
            <Card className="border-primary/30">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" />
                      CoopSetu Knowledge Assessment & Certification
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Complete this assessment to certify your knowledge and update your Skill Passport.
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary text-white text-xs">
                    Passing: {assessment?.passing_score || 75}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Result Announcement if submitted */}
                {evalResult && (
                  <div
                    className={`p-6 rounded-2xl border text-center space-y-3 ${
                      evalResult.passed
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                        : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800"
                    }`}
                  >
                    {evalResult.passed ? (
                      <>
                        <div className="size-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                          <Trophy className="size-8" />
                        </div>
                        <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                          Congratulations! You Passed with {evalResult.score}%
                        </h3>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                          Your Skill Passport has been accredited with{" "}
                          <strong>{evalResult.skill_updated?.name || "Cooperative Management"}</strong> at{" "}
                          <strong>{evalResult.skill_updated?.level || "Proficient"}</strong> level.
                        </p>

                        {evalResult.certificate && (
                          <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-left max-w-lg mx-auto shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                CoopSetu Certified Diploma
                              </span>
                              <Badge variant="outline" className="text-emerald-600 border-emerald-400 text-[10px]">
                                Verified
                              </Badge>
                            </div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                              {evalResult.certificate.course_title}
                            </p>
                            <p className="font-mono text-xs text-slate-500 mt-0.5">
                              Verification Code: {evalResult.certificate.verification_code}
                            </p>
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => router.push(evalResult.certificate.verify_url)}
                              >
                                View Verified Certificate <ExternalLink className="size-3 ml-1" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={() => router.push("/trainee/skill-passport")}
                              >
                                View Skill Passport
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-bold text-rose-800 dark:text-rose-200">
                          Score: {evalResult.score}%. Retake Recommended.
                        </h3>
                        <p className="text-xs text-rose-600 dark:text-rose-400">
                          A passing score of {assessment?.passing_score || 75}% is required to issue your certificate.
                          Review the lesson and try again!
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 text-xs border-rose-300 text-rose-700"
                          onClick={() => setEvalResult(null)}
                        >
                          Retry Assessment
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Question List */}
                {!evalResult && assessment?.questions && (
                  <div className="space-y-6">
                    {assessment.questions.map((q: any, idx: number) => (
                      <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-primary">Question {idx + 1}</span>
                          <span>Topic: {q.topic}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {q.prompt}
                        </p>

                        <RadioGroup
                          value={answers[q.id] || ""}
                          onValueChange={(val) =>
                            setAnswers((prev) => ({ ...prev, [q.id]: val }))
                          }
                          className="space-y-2 pt-1"
                        >
                          {q.options?.map((opt: any) => (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${
                                answers[q.id] === opt.id
                                  ? "border-primary bg-primary/5 text-primary font-medium"
                                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                              }`}
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                              }
                            >
                              <RadioGroupItem value={opt.id} id={`${q.id}-${opt.id}`} />
                              <label htmlFor={`${q.id}-${opt.id}`} className="cursor-pointer flex-1">
                                {opt.text}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleAssessmentSubmit}
                        disabled={evaluating || Object.keys(answers).length < assessment.questions.length}
                        className="text-xs px-6"
                      >
                        {evaluating ? "Evaluating Answers..." : "Submit & Grade Assessment"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
