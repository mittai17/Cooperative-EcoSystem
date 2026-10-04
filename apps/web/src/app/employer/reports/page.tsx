"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Download, Eye, FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReportPreviewTable } from "@/components/employer/reports/report-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { downloadReportCsv, type ReportKey } from "@/lib/employer/workflow-api";
import { useApi } from "@/lib/use-api";
import { errorMessage } from "@/lib/employer/workflow-format";

const REPORTS: { key: ReportKey; title: string; description: string }[] = [
  { key: "recruitment", title: "Recruitment Report", description: "Applications, shortlists, offers and hires for each job in the period." },
  { key: "hiring_funnel", title: "Hiring Funnel", description: "Stage-by-stage counts and drop-off across your pipeline." },
  { key: "job_performance", title: "Job Performance", description: "Applicants, shortlist rate and hires per job posting." },
  { key: "candidate_skills", title: "Candidate Skills", description: "Skills and proficiency of applicants, with verified-skill counts." },
  { key: "interview", title: "Interview Report", description: "Interview schedule, outcomes and evaluation scores." },
  { key: "employment", title: "Employment Report", description: "Hired candidates with hire dates, roles and time employed." },
  { key: "employer_feedback", title: "Employer Feedback", description: "Post-hire feedback ratings and skills your team says are needed." },
];

export default function ReportsPage() {
  const api = useApi();
  const [openKey, setOpenKey] = useState<ReportKey | null>(null);
  const [exportingKey, setExportingKey] = useState<ReportKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exportReport(key: ReportKey) {
    setExportingKey(key);
    setError(null);
    try {
      await downloadReportCsv(key);
    } catch (err) {
      setError(errorMessage(err, "The export could not be downloaded. Try again."));
    } finally {
      setExportingKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Preview recruitment reports and export them as CSV for your records or HR review."
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Export failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        {REPORTS.map((report) => {
          const isOpen = openKey === report.key;
          return (
            <Card key={report.key} className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="icon-tile-red size-10 shrink-0">
                      <FileText className="size-5" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{report.title}</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      aria-expanded={isOpen}
                      onClick={() => setOpenKey(isOpen ? null : report.key)}
                    >
                      <Eye />
                      View
                      {isOpen ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                    <Button size="sm" onClick={() => void exportReport(report.key)} disabled={exportingKey !== null}>
                      <Download />
                      {exportingKey === report.key ? "Exporting" : "Export"}
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <ReportPreviewTable api={api} reportKey={report.key} onExportError={setError} />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">Exports are CSV files. PDF export is not available yet.</p>
    </div>
  );
}
