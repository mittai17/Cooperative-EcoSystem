"use client";

import { Suspense, use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterSelect } from "@/components/employer/candidates/filter-select";
import { ProfileHeader } from "@/components/employer/candidates/profile-header";
import {
  ApplicationsPanel,
  AssessmentsPanel,
  CertificatesPanel,
  ExperiencePanel,
  OverviewPanel,
  PassportPanel,
  ProjectsPanel,
  TrainingPanel,
} from "@/components/employer/candidates/profile-panels";
import { useResource } from "@/components/employer/candidates/use-resource";
import { ExplanationList } from "@/components/employer/matching/explanation-list";
import { MatchBreakdownList } from "@/components/employer/matching/match-breakdown";
import { MatchScoreRing } from "@/components/employer/matching/match-score-ring";
import {
  type CandidateProfile,
  type CandidateApplicationRef,
  errorMessage,
  getCandidate,
  listMyJobs,
} from "@/lib/employer/candidates-api";
import { recommendedAction } from "@/components/employer/matching/recommended-action";
import { useApi } from "@/lib/use-api";

const NO_JOB = "none";

function profileDocument(profile: CandidateProfile) {
  return {
    generated_from: "NURVEX database facts",
    id: profile.id,
    name: profile.name,
    target_role: profile.occupation,
    location: profile.location,
    education_level: profile.education_level,
    years_of_experience: profile.years_of_experience,
    availability: profile.availability ?? null,
    skills: profile.skills.map((skill) => ({
      name: skill.name,
      level: skill.level,
      proficiency: skill.proficiency ?? null,
      verified: skill.verified,
      last_updated: skill.last_updated ?? null,
    })),
    certificates: profile.certificates.map((cert) => ({
      programme: cert.programme_title,
      issuer: cert.issuer ?? null,
      issue_date: cert.issue_date ?? null,
      verification_state: cert.verification_state,
    })),
  };
}

function CandidateProfileContent({ id }: { id: string }) {
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job") ?? "";
  const [tab, setTab] = useState("overview");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const profile = useResource(() => getCandidate(api, id, jobId || undefined), [id, jobId]);
  const jobs = useResource(() => listMyJobs(api), []);

  const application: CandidateApplicationRef | null = useMemo(() => {
    const list = profile.data?.applications ?? [];
    return (
      (jobId ? list.find((item) => item.job_id === jobId) : undefined) ??
      list.find((item) => item.status === "applied") ??
      null
    );
  }, [profile.data, jobId]);

  function download() {
    if (!profile.data) return;
    const blob = new Blob([JSON.stringify(profileDocument(profile.data), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `candidate-${profile.data.id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice("Profile downloaded. The file contains database facts only.");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("Profile link copied.");
    } catch (err) {
      setActionError(`Could not copy the link: ${errorMessage(err)}`);
    }
  }

  if (profile.loading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full max-w-3xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (profile.error) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>This profile could not be loaded</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>{profile.error}</span>
            <Button variant="outline" size="sm" className="w-fit" onClick={profile.reload}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = profile.data;
  if (!data) return null;

  const matchPanel = (() => {
    if (!jobId) {
      return (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">Choose one of your postings to see how this candidate scores against its requirements.</p>
            <FilterSelect
              id="match-job"
              label="Posting"
              value={NO_JOB}
              options={[
                { value: NO_JOB, label: "Select a posting" },
                ...(jobs.data ?? []).map((job) => ({ value: job.id, label: job.title })),
              ]}
              onChange={(value) => {
                if (value !== NO_JOB) router.replace(`/employer/candidates/${id}?job=${encodeURIComponent(value)}`);
              }}
            />
          </CardContent>
        </Card>
      );
    }
    if (!data.match) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No match analysis was returned for this candidate and posting.
          </CardContent>
        </Card>
      );
    }
    const match = data.match;
    const action = recommendedAction(match.score, match.missing_skills.length, match.recommended_action);
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-sm font-semibold text-foreground">Match for the selected posting</p>
            <MatchScoreRing score={match.score} size={128} />
            <p className="text-center text-xs text-muted-foreground">
              Computed from database facts by the deterministic matcher. Same inputs always give the same score.
            </p>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <MatchBreakdownList breakdown={match.breakdown} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <ExplanationList items={match.explanation} recommendedAction={action.text} recommendedIsRuleBased={action.ruleBased} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackLink />
        <p className="text-xs text-muted-foreground">Candidates / {data.name}</p>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm text-foreground">{notice}</p>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}
      {actionError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <ProfileHeader
        profile={data}
        jobId={jobId || undefined}
        application={application}
        onDownload={download}
        onCopyLink={copyLink}
        onShortlistError={setActionError}
        onShortlisted={() => {
          setActionError(null);
          setNotice(`${data.name} has been shortlisted.`);
          profile.reload();
        }}
      />

      <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="gap-6">
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <TabsList variant="line" className="w-max gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="passport">Skill Passport</TabsTrigger>
            <TabsTrigger value="training">Training History</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="match">Match Analysis</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview">
          <OverviewPanel profile={data} />
        </TabsContent>
        <TabsContent value="passport">
          <PassportPanel profile={data} />
        </TabsContent>
        <TabsContent value="training">
          <TrainingPanel items={data.training} />
        </TabsContent>
        <TabsContent value="certificates">
          <CertificatesPanel profile={data} />
        </TabsContent>
        <TabsContent value="assessments">
          <AssessmentsPanel items={data.assessments} />
        </TabsContent>
        <TabsContent value="projects">
          <ProjectsPanel items={data.projects} />
        </TabsContent>
        <TabsContent value="experience">
          <ExperiencePanel items={data.experience} />
        </TabsContent>
        <TabsContent value="applications">
          <ApplicationsPanel items={data.applications} />
        </TabsContent>
        <TabsContent value="match">{matchPanel}</TabsContent>
      </Tabs>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/employer/candidates" className={buttonVariants({ variant: "ghost", size: "sm", className: "w-fit" })}>
      <ArrowLeft /> Back to candidates
    </Link>
  );
}

export default function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <CandidateProfileContent id={id} />
    </Suspense>
  );
}

