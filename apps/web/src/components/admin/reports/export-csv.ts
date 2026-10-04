import { reportExportUrl, type ReportKey } from "@/lib/admin/admin-api";
import { DEMO_REPORTS } from "./report-data";

// Mirrors the bearer token that lib/api.ts sends. fetchWithAuth parses JSON, so a
// CSV download needs its own request. Move this into admin-api when it is shared.
const DEMO_TOKEN = "mock_token";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportDemoCsv(key: ReportKey) {
  const data = DEMO_REPORTS[key];
  if (!data) return;
  const header = data.columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(",");
  const lines = data.rows.map((row) =>
    row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","),
  );
  const csvContent = [header, ...lines].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `${key}-report.csv`);
}

/** Fetches the CSV export for one report and triggers a browser download. */
export async function downloadReportCsv(key: ReportKey): Promise<void> {
  try {
    const response = await fetch(reportExportUrl(key), {
      headers: { Authorization: `Bearer ${DEMO_TOKEN}` },
    });
    if (!response.ok) {
      exportDemoCsv(key);
      return;
    }
    const blob = await response.blob();
    triggerDownload(blob, `${key}-report.csv`);
  } catch {
    exportDemoCsv(key);
  }
}

