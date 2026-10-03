import { reportExportUrl, type ReportKey } from "@/lib/admin/admin-api";

// Mirrors the bearer token that lib/api.ts sends. fetchWithAuth parses JSON, so a
// CSV download needs its own request. Move this into admin-api when it is shared.
const DEMO_TOKEN = "mock_token";

/** Fetches the CSV export for one report and triggers a browser download. */
export async function downloadReportCsv(key: ReportKey): Promise<void> {
  const response = await fetch(reportExportUrl(key), {
    headers: { Authorization: `Bearer ${DEMO_TOKEN}` },
  });
  if (!response.ok) {
    throw new Error(`Export failed (${response.status})`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${key}-report.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
