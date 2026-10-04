"use client";

import { WelcomeBanner } from "@/components/admin/dashboard/welcome-banner";
import { KpiCardsRow } from "@/components/admin/dashboard/kpi-cards-row";
import { EnrollmentTrendCard } from "@/components/admin/dashboard/enrollment-trend-card";
import { InstitutionsByStateCard } from "@/components/admin/dashboard/institutions-by-state-card";
import { RecentActivityCard } from "@/components/admin/dashboard/recent-activity-card";
import { ProgramDistributionCard } from "@/components/admin/dashboard/program-distribution-card";
import { PlacementOverviewCard } from "@/components/admin/dashboard/placement-overview-card";
import { QuickActions } from "@/components/admin/dashboard/quick-actions";
import { TopInstitutionsCard } from "@/components/admin/dashboard/top-institutions-card";
import { RecentPlacementsCard } from "@/components/admin/dashboard/recent-placements-card";
import { AiInsightsCard } from "@/components/admin/dashboard/ai-insights-card";

const KPI_INITIAL_DATA = {
  institutions: 128,
  trainers: 842,
  trainees: 12460,
  certified: 2180,
  employers: 215,
  deltas: {
    institutions: 12,
    trainers: 48,
    trainees: 1240,
    certified: 320,
    employers: 28,
  },
};

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto pb-10">
      {/* 1. Welcome Banner */}
      <WelcomeBanner />

      {/* 2. 5 KPI Cards in 1 Row */}
      <KpiCardsRow data={KPI_INITIAL_DATA} />

      {/* 3. Row 1: Trainee Enrollment Trend | Institutions by State | Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <EnrollmentTrendCard />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <InstitutionsByStateCard />
        </div>
        <div className="lg:col-span-3 flex flex-col">
          <RecentActivityCard />
        </div>
      </div>

      {/* 4. Row 2: Program Distribution | Placement Overview | Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-4 flex flex-col">
          <ProgramDistributionCard />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <PlacementOverviewCard />
        </div>
        <div className="lg:col-span-3 flex flex-col">
          <QuickActions />
        </div>
      </div>

      {/* 5. Row 3: Top Institutions | Recent Job Placements | AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <TopInstitutionsCard />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <RecentPlacementsCard />
        </div>
        <div className="lg:col-span-3 flex flex-col">
          <AiInsightsCard />
        </div>
      </div>
    </div>
  );
}
