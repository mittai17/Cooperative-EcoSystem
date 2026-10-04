"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { getAdminDashboard, getReport, type ReportResponse } from "@/lib/admin/admin-api";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import {
  DEMO_DONUT,
  DEMO_REPORTS,
  REPORT_PERIODS,
  REPORT_TABS,
  chartBars,
  type ChartPoint,
  type ReportKey,
} from "@/components/admin/reports/report-data";
import { downloadReportCsv } from "@/components/admin/reports/export-csv";
import { AdminSelect } from "@/components/admin/shared/admin-toolbar";
import { EmptyState, TableScroll, tableClass, thClass, tdClass, rowClass } from "@/components/admin/programmes/admin-ui";

// Recharts measures the DOM, so the chart components are loaded only in the browser.
const EnrollmentBarChart = dynamic(
  () => import("@/components/admin/reports/report-charts").then((m) => m.EnrollmentBarChart),
  { ssr: false },
);
const DistributionDonut = dynamic(
  () => import("@/components/admin/reports/report-charts").then((m) => m.DistributionDonut),
  { ssr: false },
);

const BAR_TITLES: Record<ReportKey, string> = {
  enrollment: "Trainee Enrollment",
  placements: "Placements by Month",
  assessments: "Average Score by Assessment",
  certifications: "Certifications by Program",
};

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportKey>("enrollment");
  const [months, setMonths] = useState<number>(6);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [donut, setDonut] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [data, dashboard] = await Promise.all([getReport(tab), getAdminDashboard()]);
        if (cancelled) return;
        const validReport = data && data.rows && data.rows.length > 0 ? data : DEMO_REPORTS[tab];
        const validDonut =
          dashboard && dashboard.program_distribution && dashboard.program_distribution.length > 0
            ? dashboard.program_distribution.map((p) => ({ label: p.label, value: p.percent }))
            : DEMO_DONUT;
        setReport(validReport);
        setDonut(validDonut);
        setUsingDemo(validReport === DEMO_REPORTS[tab]);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setReport(DEMO_REPORTS[tab]);
        setDonut(DEMO_DONUT);
        setUsingDemo(true);
        setError(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, reloadKey]);

  const bars = report ? chartBars(report.chart) : [];
  // The period select trims the monthly series to the most recent N points.
  const visibleBars = tab === "enrollment" || tab === "placements" ? bars.slice(-months) : bars;

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await downloadReportCsv(tab);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Download}
        title="Reports"
        description="View and export platform reports."
        action={
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary bg-card px-4 text-sm font-semibold text-primary shadow-sm hover:bg-primary/5 disabled:opacity-60"
          >
            <Download className="size-4" aria-hidden /> {exporting ? "Exporting..." : "Export Report"}
          </button>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div role="tablist" aria-label="Report type" className="flex flex-wrap gap-6 border-b border-border">
          {REPORT_TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {usingDemo ? <DemoBanner /> : null}
            <span className="text-xs text-muted-foreground">Live data unavailable: {error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : null}
        {exportError ? (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            Could not export: {exportError}
          </p>
        ) : null}

        {loading ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2" aria-busy="true" aria-label="Loading report">
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-border p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-foreground">{BAR_TITLES[tab]}</h2>
                  {tab === "enrollment" || tab === "placements" ? (
                    <AdminSelect
                      label="Chart period"
                      value={String(months)}
                      options={REPORT_PERIODS.map((p) => ({ value: String(p.value), label: p.label }))}
                      onChange={(value) => setMonths(Number(value))}
                    />
                  ) : null}
                </div>
                <div className="h-64">
                  {visibleBars.length === 0 ? <EmptyChart /> : <EnrollmentBarChart data={visibleBars} />}
                </div>
              </section>

              <section className="rounded-xl border border-border p-5">
                <h2 className="mb-4 text-base font-semibold text-foreground">Program-wise Distribution</h2>
                <div className="h-64">
                  {donut.length === 0 ? <EmptyChart /> : <DistributionDonut data={donut} />}
                </div>
              </section>
            </div>

            <div className="mt-6">
              {!report || report.rows.length === 0 ? (
                <EmptyState message="No rows for this report yet." />
              ) : (
                <TableScroll>
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        {report.columns.map((col) => (
                          <th key={col} className={thClass}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((row, i) => (
                        <tr key={i} className={rowClass}>
                          {row.map((cell, j) => (
                            <td key={j} className={tdClass}>
                              {typeof cell === "number" ? cell.toLocaleString("en-IN") : (cell ?? "-")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      No chart data yet.
    </div>
  );
}
