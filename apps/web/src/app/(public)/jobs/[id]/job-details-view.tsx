"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  ChevronLeft,
  CircleCheck,
  CircleX,
  MapPin,
  Sparkles,
  CheckCircle2,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Job } from "@/lib/types";
import { getJobMatch, getRecommendedCourse } from "@/lib/job-match";
import { buildCompanyBlurb, buildRequirements, buildResponsibilities } from "./job-copy";
import { getActiveDemoSession } from "@/lib/demo-users";
import { useT } from "@/i18n";

function MatchGauge({ percent }: { percent: number }) {
  const size = 176;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="stroke-success transition-[stroke-dashoffset] duration-700 ease-out"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="rotate-90 fill-foreground font-heading text-3xl font-extrabold"
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
      >
        {percent}%
      </text>
    </svg>
  );
}

export function JobDetailsView({ job }: { job: Job }) {
  const [saved, setSaved] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [isApplied, setIsApplied] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("coopsetu_applications");
        if (stored) {
          const apps = JSON.parse(stored);
          return apps.some((a: { jobId?: string; title?: string }) => a.jobId === job.id || a.title === job.title);
        }
      } catch {}
    }
    return false;
  });

  const session = getActiveDemoSession();
  const applicantName = session.name || "Ravindra Suresh Patil";
  const applicantEmail = session.email || "ravindra.patil@coopsetu.ai";

  const t = useT();
  const match = getJobMatch(job);
  const recommendedCourse = getRecommendedCourse(job);
  const responsibilities = buildResponsibilities(job, t);
  const requirements = buildRequirements(job, t);
  const companyBlurb = buildCompanyBlurb(job, t);

  const handleSubmitApplication = () => {
    setSubmitting(true);
    setTimeout(() => {
      const newApp = {
        id: `app-${Date.now()}`,
        jobId: job.id,
        title: job.title,
        employer: job.employer,
        location: job.location,
        type: job.type,
        date: new Date().toISOString().split("T")[0],
        status: "Applied",
        coverNote,
      };

      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("coopsetu_applications");
          const list = stored ? JSON.parse(stored) : [];
          localStorage.setItem("coopsetu_applications", JSON.stringify([newApp, ...list]));
        } catch {}
      }

      setIsApplied(true);
      setSubmitting(false);
      setAppliedSuccess(true);
    }, 700);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> {t("public.jobDetails.backToJobs")}
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{job.title}</h1>
            <Badge className="gap-1 bg-success/10 text-success">
              <Sparkles className="size-3" /> {t("public.jobDetails.match").replace("{percent}", String(match.percent))}
            </Badge>
            {isApplied && (
              <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <CheckCircle2 className="size-3" /> {t("public.jobDetails.applicationSubmittedBadge")}
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-4" /> {job.employer}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" /> {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-4" /> {job.type}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 items-center">
          {isApplied ? (
            <Link className="contents" href="/trainee/applications"><Button size="lg" variant="secondary"   nativeButton={false}>{t("public.jobDetails.viewInApplications")} <ArrowRight className="ml-1.5 size-4" /></Button></Link>
          ) : (
            <Button size="lg" onClick={() => setApplyModalOpen(true)}>
              {t("public.jobDetails.applyWithPassport")}
            </Button>
          )}
          <Button size="lg" variant="outline" className="gap-1.5" onClick={() => setSaved((v) => !v)}>
            {saved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
            {saved ? t("public.jobDetails.saved") : t("public.jobDetails.save")}
          </Button>
        </div>
      </div>

      {/* Interactive Apply Dialog */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{t("public.jobDetails.applyTitle").replace("{title}", job.title)}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {job.employer} &middot; {job.location}
            </DialogDescription>
          </DialogHeader>

          {appliedSuccess ? (
            <div className="py-6 flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="size-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">{t("public.jobDetails.submittedTitle")}</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {t("public.jobDetails.submittedBodyBefore")} <strong>{job.employer}</strong>{t("public.jobDetails.submittedBodyAfter")}
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => setApplyModalOpen(false)}>
                  {t("public.jobDetails.done")}
                </Button>
                <Link className="contents" href="/trainee/applications"><Button size="sm"   nativeButton={false}>{t("public.jobDetails.goToApplications")}</Button></Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs sm:text-sm">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-3">
                <BadgeCheck className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground text-xs sm:text-sm">
                    {t("public.jobDetails.passportAttached").replace("{percent}", String(match.percent))}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t("public.jobDetails.includesSkills").replace("{skills}", job.skillsRequired.slice(0, 3).join(", "))}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
                <p className="text-xs font-semibold text-foreground">{t("public.jobDetails.applicantDetails")}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">{t("public.jobDetails.candidate")}</span>
                    <p className="font-medium text-foreground">{applicantName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("public.jobDetails.email")}</span>
                    <p className="font-medium text-foreground truncate">{applicantEmail}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  {t("public.jobDetails.noteToEmployer")}
                </label>
                <Textarea
                  placeholder={t("public.jobDetails.notePlaceholder")}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  className="text-xs min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={() => setApplyModalOpen(false)}>
                  {t("public.jobDetails.cancel")}
                </Button>
                <Button size="sm" onClick={handleSubmitApplication} disabled={submitting}>
                  {submitting ? t("public.jobDetails.submitting") : t("public.jobDetails.confirmApply")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList variant="line" className="flex-wrap border-b border-border">
          <TabsTrigger value="overview">{t("public.jobDetails.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="requirements">{t("public.jobDetails.tabs.requirements")}</TabsTrigger>
          <TabsTrigger value="skills">{t("public.jobDetails.tabs.skills")}</TabsTrigger>
          <TabsTrigger value="match">{t("public.jobDetails.tabs.match")}</TabsTrigger>
          <TabsTrigger value="company">{t("public.jobDetails.tabs.company")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">{t("public.jobDetails.aboutRole")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">{t("public.jobDetails.whatYoullDo")}</h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {responsibilities.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground">{t("public.jobDetails.salary")}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{job.salaryRange}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground">{t("public.jobDetails.openings")}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{job.openings}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground">{t("public.jobDetails.sector")}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{job.sector}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground">{t("public.jobDetails.posted")}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {job.postedDaysAgo === 0 ? t("public.jobDetails.today") : t("public.jobDetails.postedAgo").replace("{count}", String(job.postedDaysAgo))}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">{t("public.jobDetails.whatYoullNeed")}</h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {requirements.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">{t("public.jobDetails.skillsRequired")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {job.skillsRequired.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-sm font-normal">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="match" className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-2">
            <div className="flex flex-col items-center justify-center gap-2">
              <MatchGauge percent={match.percent} />
              <p className="text-sm text-muted-foreground">{t("public.jobDetails.basedOnPassport")}</p>
            </div>
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t("public.jobDetails.matchedSkills").replace("{matched}", String(match.matched.length)).replace("{total}", String(job.skillsRequired.length))}
                </h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {job.skillsRequired.map((skill) => {
                    const isMatched = match.matched.includes(skill);
                    return (
                      <li
                        key={skill}
                        className={cnRow(isMatched)}
                      >
                        {isMatched ? (
                          <CircleCheck className="size-4 shrink-0 text-success" />
                        ) : (
                          <CircleCheck className="size-4 shrink-0 text-muted-foreground/40" />
                        )}
                        {skill}
                      </li>
                    );
                  })}
                </ul>
              </div>
              {match.missing.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("public.jobDetails.missingSkills")}</h3>
                  <ul className="mt-2 flex flex-col gap-2">
                    {match.missing.map((skill) => (
                      <li key={skill} className="flex items-center gap-2 text-sm text-foreground">
                        <CircleX className="size-4 shrink-0 text-tint-amber-fg" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="icon-tile-red flex size-11 shrink-0 items-center justify-center">
                <Sparkles className="size-5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("public.jobDetails.recommendedCourse")}</p>
                <p className="text-sm font-semibold text-foreground">{recommendedCourse.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t("public.courseCatalog.hours").replace("{count}", String(recommendedCourse.durationHours))} &middot; {recommendedCourse.category}
                </p>
              </div>
            </div>
            <Link className="contents" href={`/courses/${recommendedCourse.id}`}><Button
              className="w-full shrink-0 sm:w-auto"
              
             nativeButton={false}>{t("public.courseCatalog.viewCourse")}</Button></Link>
          </div>
        </TabsContent>

        <TabsContent value="company" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="icon-tile-red flex size-12 shrink-0 items-center justify-center">
                <Building2 className="size-5" strokeWidth={1.9} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">{job.employer}</h2>
                <p className="text-sm text-muted-foreground">{job.sector}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{companyBlurb}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cnRow(matched: boolean) {
  return matched
    ? "flex items-center gap-2 text-sm text-foreground"
    : "flex items-center gap-2 text-sm text-muted-foreground/60 line-through decoration-muted-foreground/40";
}
