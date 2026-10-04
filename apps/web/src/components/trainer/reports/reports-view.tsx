"use client";

import { useMemo, useState } from "react";
import { Download, Eye, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { FilterSelect } from "@/components/trainer/filter-select";
import { TrainerApiError, trainerFetch, useTrainerQuery } from "@/lib/trainer/api";

interface Types {
  types: { type: string; title: string; description: string }[];
  batches: { id: string; name: string }[];
  courses: { id: string; title: string; batch_id: string }[];
}
interface ReportData {
  type: string;
  generated_at: string;
  columns: string[];
  rows: (string | number | null)[][];
  summary: Record<string, number | null>;
}

const label = (k: string) => k.replace(/_/g, " ").replace(/\bpct\b/, "%");

export function ReportsView() {
  const meta = useTrainerQuery<Types>("/reports/types");
  const [batch, setBatch] = useState("");
  const [course, setCourse] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [rLoading, setRLoading] = useState(false);
  const [rError, setRError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const courses = useMemo(
    () => (meta.data?.courses ?? []).filter((c) => !batch || c.batch_id === batch),
    [meta.data, batch],
  );
  const qs = () => {
    const p = new URLSearchParams();
    if (batch) p.set("batch_id", batch);
    if (course) p.set("course_id", course);
    return p;
  };

  const view = async (type: string) => {
    setActive(type);
    setReport(null);
    setRError(null);
    setRLoading(true);
    try {
      const p = qs();
      p.set("fmt", "json");
      setReport(await trainerFetch<ReportData>(`/reports/${type}?${p}`));
    } catch (e) {
      setRError(e instanceof TrainerApiError ? e.message : "Failed to load report");
    } finally {
      setRLoading(false);
    }
  };

  const exportCsv = async (type: string) => {
    setBusy(type);
    setExportError(null);
    try {
      const rep = report?.type === type ? report : await trainerFetch<ReportData>(`/reports/${type}?${qs()}`);
      const header = rep.columns.join(",");
      const rows = rep.rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([`${header}\n${rows}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  if (meta.loading && !meta.data) return <LoadingBlock rows={4} />;
  if (meta.error) return <ErrorState message={meta.error} onRetry={meta.refetch} />;
  if (!meta.data) return null;
  if (meta.data.batches.length === 0) return <EmptyState title="No classes assigned" hint="Reports appear once you teach a batch." />;

  const activeType = meta.data.types.find((t) => t.type === active);
  const ctx = [batch && meta.data.batches.find((b) => b.id === batch)?.name, course && courses.find((c) => c.id === course)?.title]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/60 bg-card p-4">
        <FilterSelect
          label="Batch"
          value={batch}
          onChange={(v) => {
            setBatch(v);
            setCourse("");
          }}
          options={[{ value: "", label: "All batches" }, ...meta.data.batches.map((b) => ({ value: b.id, label: b.name }))]}
          className="w-44"
        />
        <FilterSelect
          label="Course"
          value={course}
          onChange={setCourse}
          options={[{ value: "", label: "All courses" }, ...courses.map((c) => ({ value: c.id, label: c.title }))]}
          className="w-64 max-w-full"
        />
        <p className="text-xs text-muted-foreground">Course filter applies to attendance, assessment and progress reports.</p>
      </div>

      {exportError && <ErrorState message={exportError} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {meta.data.types.map((t) => (
          <div key={t.type} className="flex flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex gap-3">
              <span className="icon-tile-red size-10 shrink-0">
                <FileText className="size-5" />
              </span>
              <div>
                <h3 className="font-heading text-base font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => view(t.type)}>
                <Eye /> View
              </Button>
              <Button size="sm" variant="outline" disabled={busy === t.type} onClick={() => exportCsv(t.type)}>
                <Download /> {busy === t.type ? "Exporting…" : "CSV"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => view(t.type).then(() => setTimeout(() => window.print(), 300))}
              >
                <Printer /> PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent id="report-print" className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{activeType?.title}</DialogTitle>
            <DialogDescription>
              {ctx || "All batches"}
              {report && ` · generated ${new Date(report.generated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`}
            </DialogDescription>
          </DialogHeader>
          {rLoading ? (
            <LoadingBlock rows={4} />
          ) : rError ? (
            <ErrorState message={rError} onRetry={() => active && view(active)} />
          ) : report && report.rows.length === 0 ? (
            <EmptyState title="No data for these filters" />
          ) : report ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(report.summary).map(([k, v]) => (
                  <span key={k} className="rounded-full border border-border px-2.5 py-1 capitalize">
                    {label(k)}: <b>{v ?? "—"}</b>
                  </span>
                ))}
              </div>
              <div className="report-scroll max-h-[55vh] overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {report.columns.map((c) => (
                        <TableHead key={c} className="whitespace-nowrap">
                          {c}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.rows.map((r, i) => (
                      <TableRow key={i}>
                        {r.map((c, j) => (
                          <TableCell key={j} className="whitespace-nowrap">
                            {c ?? "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <Button size="sm" variant="outline" onClick={() => active && exportCsv(active)}>
                  <Download /> Export CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer /> Print / Save as PDF
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-print, #report-print * { visibility: visible !important; }
          #report-print { position: absolute !important; inset: 0 !important; transform: none !important; max-width: none !important; max-height: none !important; box-shadow: none !important; }
          #report-print .report-scroll { max-height: none !important; overflow: visible !important; }
          #report-print [data-slot="dialog-close"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
