"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  getEmployerDashboard,
  listEmployerJobs,
  mockEmployerJobs,
  type EmployerDashboard,
  type EmployerJob,
  type FunnelRange,
  type TimelineRange,
} from "@/lib/employer/jobs-api";
import { ActiveJobsTable } from "./active-jobs-table";
import { AiRecruitmentInsight } from "./ai-recruitment-insight";
import { ApplicationFunnel, type CustomRange } from "./application-funnel";
import { CandidateSourceDonut } from "./candidate-source";
import { demoDashboard, demoFunnel, demoTimeline } from "./demo-data";
import { EmployerFeedbackCard } from "./employer-feedback";
import { HiringTimeline } from "./hiring-timeline";
import { KpiRow } from "./kpi-row";
import { QuickActions } from "./quick-actions";
import { RecentApplications } from "./recent-applications";
import { SkillMatchInsights } from "./skill-match-insights";
import { TodayPanel } from "./today-panel";
import { TopMatchedCandidates } from "./top-matched-candidates";
import { UpcomingInterviews } from "./upcoming-interviews";
import { WelcomeBanner } from "./welcome-banner";

const DEFAULT_FUNNEL: FunnelRange = "3m";
const DEFAULT_TIMELINE: TimelineRange = "6m";

/**
 * Demo fallback is on by default, matching the previous page. Set
 * NEXT_PUBLIC_EMPLOYER_DEMO_FALLBACK=false to surface the real error state instead.
 */
const DEMO_FALLBACK_ENABLED = process.env.NEXT_PUBLIC_EMPLOYER_DEMO_FALLBACK !== "false";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Could not reach the NURVEX API";
}

export function EmployerDashboardView() {
  const [dashboard, setDashboard] = useState<EmployerDashboard | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);
  /** Set when the dashboard could not be loaded at all (no demo fallback). */
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [funnelRange, setFunnelRange] = useState<FunnelRange>(DEFAULT_FUNNEL);
  const [customRange, setCustomRange] = useState<CustomRange>({ from: "", to: "" });
  const [timelineRange, setTimelineRange] = useState<TimelineRange>(DEFAULT_TIMELINE);
  const [filterBusy, setFilterBusy] = useState(false);

  const [jobs, setJobs] = useState<EmployerJob[] | null>(null);
  const [jobsError, setJobsError] = useState(false);

  // Latest-request-wins guard, and whether the data currently shown is live (not demo).
  const requestSeq = useRef(0);
  const hasLiveData = useRef(false);

  const fetchDashboard = useCallback(
    async (funnel: FunnelRange, timeline: TimelineRange, custom?: CustomRange) => {
      const seq = ++requestSeq.current;
      setFilterBusy(true);
      try {
        const data = await getEmployerDashboard({
          funnel_range: funnel,
          funnel_from: funnel === "custom" ? custom?.from : undefined,
          funnel_to: funnel === "custom" ? custom?.to : undefined,
          timeline_range: timeline,
        });
        if (seq !== requestSeq.current) return;
        if (!data || !data.kpis || typeof data.kpis !== "object") {
          throw new Error("Invalid dashboard data received");
        }
        hasLiveData.current = true;
        const demo = demoDashboard(funnel, timeline);
        const enriched: EmployerDashboard = {
          viewer_name: data.viewer_name || demo.viewer_name,
          organisation_name: data.organisation_name || demo.organisation_name,
          kpis: data.kpis ?? demo.kpis,
          today: data.today && data.today.length > 0 ? data.today : demo.today,
          funnel: data.funnel && data.funnel.length > 0 ? data.funnel : demo.funnel,
          skill_match: data.skill_match && data.skill_match.length > 0 ? data.skill_match : demo.skill_match,
          top_candidates: data.top_candidates && data.top_candidates.length > 0 ? data.top_candidates : demo.top_candidates,
          recent_applications: data.recent_applications && data.recent_applications.length > 0 ? data.recent_applications : demo.recent_applications,
          candidate_sources: data.candidate_sources && data.candidate_sources.length > 0 ? data.candidate_sources : demo.candidate_sources,
          hiring_timeline: data.hiring_timeline && data.hiring_timeline.length > 0 ? data.hiring_timeline : demo.hiring_timeline,
          upcoming_interviews: data.upcoming_interviews && data.upcoming_interviews.length > 0 ? data.upcoming_interviews : demo.upcoming_interviews,
          feedback: data.feedback && data.feedback.length > 0 ? data.feedback : demo.feedback,
        };
        setDashboard(enriched);
        setUsingDemo(false);
        setLoadError(null);
        setFilterError(null);
      } catch (err) {
        if (seq !== requestSeq.current) return;
        const message = errorMessage(err);
        if (hasLiveData.current) {
          // A filter or refresh failed after live data loaded: keep the figures on screen.
          setFilterError(`Could not update the dashboard: ${message}. Showing the previous figures.`);
          return;
        }
        setLoadError(message);
        setFilterError(null);
        if (DEMO_FALLBACK_ENABLED) {
          setDashboard(demoDashboard(funnel, timeline));
          setUsingDemo(true);
        } else {
          setDashboard(null);
        }
      } finally {
        if (seq === requestSeq.current) setFilterBusy(false);
      }
    },
    [],
  );

  const loadJobs = useCallback(async () => {
    setJobsError(false);
    try {
      const res = await listEmployerJobs();
      setJobs(Array.isArray(res) && res.length > 0 ? res : mockEmployerJobs);
    } catch {
      setJobs(mockEmployerJobs);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchDashboard(DEFAULT_FUNNEL, DEFAULT_TIMELINE);
      void loadJobs();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchDashboard, loadJobs]);

  function retryAll() {
    void fetchDashboard(funnelRange, timelineRange, customRange);
    void loadJobs();
  }

  // Demo data is filtered locally; live data is refetched with the new query.
  function changeFunnelRange(next: FunnelRange) {
    setFunnelRange(next);
    if (next === "custom") {
      // Wait for explicit dates before calling the API.
      if (usingDemo) setDashboard((current) => (current ? { ...current, funnel: demoFunnel("custom") } : current));
      return;
    }
    if (usingDemo) {
      setDashboard((current) => (current ? { ...current, funnel: demoFunnel(next) } : current));
      return;
    }
    void fetchDashboard(next, timelineRange);
  }

  function applyCustomRange(range: CustomRange) {
    setCustomRange(range);
    if (usingDemo) {
      setDashboard((current) => (current ? { ...current, funnel: demoFunnel("custom") } : current));
      return;
    }
    void fetchDashboard("custom", timelineRange, range);
  }

  function changeTimelineRange(next: TimelineRange) {
    setTimelineRange(next);
    if (usingDemo) {
      setDashboard((current) => (current ? { ...current, hiring_timeline: demoTimeline(next) } : current));
      return;
    }
    void fetchDashboard(funnelRange, next, customRange);
  }

  const failed = dashboard === null && loadError !== null;
  const loading = dashboard === null && !failed;
  const activeJobCount = dashboard?.kpis?.active_jobs?.value ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {loadError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{usingDemo ? "Live dashboard unavailable" : "Could not load the dashboard"}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>
              {usingDemo
                ? "The employer dashboard could not be loaded, so the sections below show clearly labelled demo data."
                : `${loadError}. Try again once the API is reachable.`}
            </span>
            <Button size="sm" variant="outline" onClick={retryAll}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {filterError && (
        <p className="text-xs text-destructive" role="alert">
          {filterError}
        </p>
      )}
      {usingDemo && (
        <div>
          <span className="demo-data-tag">Demo data · fictional figures</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <WelcomeBanner
          name={dashboard?.viewer_name ?? "Employer team"}
          organisation={dashboard?.organisation_name ?? "Your organisation"}
        />
        <TodayPanel items={dashboard?.today ?? null} loading={loading} error={failed} onRetry={retryAll} />
      </div>

      <KpiRow kpis={dashboard?.kpis ?? null} loading={loading} error={failed} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <div className="lg:col-span-2 xl:col-span-2">
          <ApplicationFunnel
            stages={dashboard?.funnel ?? null}
            loading={loading}
            error={failed}
            range={funnelRange}
            customRange={customRange}
            busy={filterBusy}
            onRangeChange={changeFunnelRange}
            onApplyCustom={applyCustomRange}
            onRetry={retryAll}
          />
        </div>
        <SkillMatchInsights
          items={dashboard?.skill_match ?? null}
          loading={loading}
          error={failed}
          onRetry={retryAll}
        />
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2 xl:col-span-2">
          <TopMatchedCandidates
            items={dashboard?.top_candidates ?? null}
            loading={loading}
            error={failed}
            onRetry={retryAll}
          />
        </div>
        <RecentApplications
          items={dashboard?.recent_applications ?? null}
          loading={loading}
          error={failed}
          onRetry={retryAll}
        />
        <div className="flex flex-col gap-6">
          <CandidateSourceDonut
            sources={dashboard?.candidate_sources ?? null}
            total={dashboard?.kpis?.applications?.value ?? 0}
            loading={loading}
            error={failed}
            onRetry={retryAll}
          />
          <HiringTimeline
            points={dashboard?.hiring_timeline ?? null}
            range={timelineRange}
            loading={loading}
            error={failed}
            busy={filterBusy}
            onRangeChange={changeTimelineRange}
            onRetry={retryAll}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ActiveJobsTable jobs={jobs} loading={jobs === null} error={jobsError} onRetry={() => void loadJobs()} />
        <UpcomingInterviews
          items={dashboard?.upcoming_interviews ?? null}
          loading={loading}
          error={failed}
          onRetry={retryAll}
          onChanged={retryAll}
        />
        <EmployerFeedbackCard
          items={dashboard?.feedback ?? null}
          loading={loading}
          error={failed}
          onRetry={retryAll}
        />
      </div>

      <AiRecruitmentInsight dashboard={dashboard} activeJobs={activeJobCount} loading={loading} error={failed} />
    </div>
  );
}
