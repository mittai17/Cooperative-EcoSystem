import { PageHeader } from "@/components/dashboard/page-header";
import { AnalyticsView } from "@/components/trainer/analytics/analytics-view";

export default function TrainerAnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Attendance, assessment, learning and skill trends across your batches." />
      <AnalyticsView />
    </div>
  );
}
