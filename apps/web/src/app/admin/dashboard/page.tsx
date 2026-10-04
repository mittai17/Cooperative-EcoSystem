"use client";

import { useEffect, useState } from "react";
import { getAdminDashboard, type AdminDashboard } from "@/lib/admin/admin-api";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { WelcomeBanner } from "@/components/admin/dashboard/welcome-banner";
import { KpiCardsRow } from "@/components/admin/dashboard/kpi-cards-row";
import { EnrollmentTrendCard } from "@/components/admin/dashboard/enrollment-trend-card";
import { StateTileMap } from "@/components/admin/dashboard/state-tile-map";
import { RecentActivityCard } from "@/components/admin/dashboard/recent-activity-card";
import { ProgramDistributionCard } from "@/components/admin/dashboard/program-distribution-card";
import { PlacementOverviewCard } from "@/components/admin/dashboard/placement-overview-card";
import { QuickActions } from "@/components/admin/dashboard/quick-actions";
import { TopInstitutionsCard } from "@/components/admin/dashboard/top-institutions-card";
import { RecentPlacementsCard } from "@/components/admin/dashboard/recent-placements-card";
import { AiInsightsCard } from "@/components/admin/dashboard/ai-insights-card";
import { DashboardPanelPlaceholder } from "@/components/admin/dashboard/loading";
import { DEMO_DASHBOARD } from "@/components/admin/dashboard/demo-data";

type DashboardState =
  | { status: "loading" }
  | { status: "live"; data: AdminDashboard }
  | { status: "demo"; data: AdminDashboard };

function mergeDashboard(data?: Partial<AdminDashboard>): AdminDashboard {
  if (!data) return DEMO_DASHBOARD;
  const kpis = data.kpis;
  return {
    kpis: {
      institutions: kpis?.institutions || DEMO_DASHBOARD.kpis.institutions,
      trainers: kpis?.trainers || DEMO_DASHBOARD.kpis.trainers,
      trainees: kpis?.trainees || DEMO_DASHBOARD.kpis.trainees,
      certified: kpis?.certified || DEMO_DASHBOARD.kpis.certified,
      employers: kpis?.employers || DEMO_DASHBOARD.kpis.employers,
      deltas: kpis?.deltas ?? DEMO_DASHBOARD.kpis.deltas,
    },
    enrollment_trend: data.enrollment_trend && data.enrollment_trend.length > 0 ? data.enrollment_trend : DEMO_DASHBOARD.enrollment_trend,
    institutions_by_state: data.institutions_by_state && data.institutions_by_state.length > 0 ? data.institutions_by_state : DEMO_DASHBOARD.institutions_by_state,
    program_distribution: data.program_distribution && data.program_distribution.length > 0 ? data.program_distribution : DEMO_DASHBOARD.program_distribution,
    placement_overview: data.placement_overview && data.placement_overview.length > 0 ? data.placement_overview : DEMO_DASHBOARD.placement_overview,
    top_institutions: data.top_institutions && data.top_institutions.length > 0 ? data.top_institutions : DEMO_DASHBOARD.top_institutions,
    recent_activity: data.recent_activity && data.recent_activity.length > 0 ? data.recent_activity : DEMO_DASHBOARD.recent_activity,
    recent_placements: data.recent_placements && data.recent_placements.length > 0 ? data.recent_placements : DEMO_DASHBOARD.recent_placements,
    ai_insights: data.ai_insights && data.ai_insights.length > 0 ? data.ai_insights : DEMO_DASHBOARD.ai_insights,
  };
}

export default function AdminDashboardPage() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getAdminDashboard()
      .then((data) => {
        if (!cancelled) setState({ status: "live", data: mergeDashboard(data) });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "demo", data: DEMO_DASHBOARD });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading dashboard">
        <DashboardPanelPlaceholder className="h-28" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <DashboardPanelPlaceholder key={index} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <DashboardPanelPlaceholder className="h-80 lg:col-span-5" />
          <DashboardPanelPlaceholder className="h-80 lg:col-span-7" />
        </div>
      </div>
    );
  }

  const { data } = state;

  return (
    <div className="flex flex-col gap-6">
      {state.status === "demo" ? (
        <DemoBanner message="The live dashboard could not be reached. Showing fictional sample figures." />
      ) : null}

      <WelcomeBanner />

      <KpiCardsRow data={data.kpis} />

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col lg:col-span-5">
          <EnrollmentTrendCard points={data.enrollment_trend} />
        </div>
        <div className="flex min-w-0 flex-col lg:col-span-4">
          <StateTileMap data={data.institutions_by_state} />
        </div>
        <div className="flex min-w-0 flex-col lg:col-span-3">
          <RecentActivityCard items={data.recent_activity} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col lg:col-span-4">
          <ProgramDistributionCard points={data.program_distribution} trainees={data.kpis.trainees} />
        </div>
        <div className="flex min-w-0 flex-col lg:col-span-5">
          <PlacementOverviewCard points={data.placement_overview} />
        </div>
        <div className="flex min-w-0 flex-col lg:col-span-3">
          <QuickActions />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col lg:col-span-5">
          <TopInstitutionsCard rows={data.top_institutions} />
        </div>
        <div className="flex min-w-0 flex-col lg:col-span-4">
          <RecentPlacementsCard rows={data.recent_placements} />
        </div>
        <div className="flex min-w-0 flex-col lg:col-span-3">
          <AiInsightsCard insights={data.ai_insights} />
        </div>
      </div>
    </div>
  );
}
