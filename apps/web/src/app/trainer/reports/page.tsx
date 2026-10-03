import { PageHeader } from "@/components/dashboard/page-header";
import { ReportsView } from "@/components/trainer/reports/reports-view";

export default function TrainerReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generate, preview and export attendance, assessment, progress and skill reports." />
      <ReportsView />
    </div>
  );
}
