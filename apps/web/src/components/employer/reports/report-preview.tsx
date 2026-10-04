"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadReportCsv, getReportPreview, type Api, type ReportKey, type ReportPreview } from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";

const PREVIEW_ROW_LIMIT = 10;

interface ReportPreviewProps {
  api: Api;
  reportKey: ReportKey;
  onExportError: (message: string) => void;
}

/** Inline preview of one report. Shows the first rows only; the CSV export carries the full set. */
export function ReportPreviewTable({ api, reportKey, onExportError }: ReportPreviewProps) {
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPreview(await getReportPreview(api, reportKey));
    } catch (err) {
      setError(errorMessage(err, "This report could not be previewed."));
      setPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportKey]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function exportCsv() {
    setExporting(true);
    try {
      await downloadReportCsv(reportKey);
    } catch (err) {
      onExportError(errorMessage(err, "The export could not be downloaded. Try again."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {preview
            ? `Showing ${Math.min(PREVIEW_ROW_LIMIT, preview.rows.length)} of ${preview.total_rows} rows`
            : "Preview"}
        </p>
        <Button size="sm" onClick={exportCsv} disabled={exporting}>
          {exporting ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
          Export CSV
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!error && preview === null && <Skeleton className="h-40 w-full" />}

      {!error && preview !== null && preview.rows.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">No rows for this report yet.</p>
      )}

      {!error && preview !== null && preview.rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {preview.columns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.rows.slice(0, PREVIEW_ROW_LIMIT).map((row, idx) => (
                <TableRow key={idx}>
                  {preview.columns.map((col) => (
                    <TableCell key={col.key}>{row[col.key] ?? "—"}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
