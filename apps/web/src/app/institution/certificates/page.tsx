"use client";

import { useState } from "react";
import { Award, CheckCircle, CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type CertStatus = "Eligible" | "Issued" | "Pending";

interface CertRecord {
  id: string;
  trainee: string;
  course: string;
  score: number;
  attendance: number;
  status: CertStatus;
  certificateId?: string;
}

// ── Initial data ──────────────────────────────────────────────────────────────

const INITIAL_DATA: CertRecord[] = [
  { id: "1", trainee: "Anjali Rathore",  course: "Cooperative Management",  score: 88, attendance: 95, status: "Eligible" },
  { id: "2", trainee: "Farida Khatoon", course: "Dairy Operations",         score: 92, attendance: 98, status: "Issued",  certificateId: "CST-2026-DAI-00842" },
  { id: "3", trainee: "Ramesh Singh",   course: "Bookkeeping",              score: 65, attendance: 70, status: "Pending" },
  { id: "4", trainee: "Priya Mehta",    course: "PACS Digital Accounting",  score: 91, attendance: 93, status: "Eligible" },
  { id: "5", trainee: "Suresh Kumar",   course: "Cooperative Management",   score: 74, attendance: 82, status: "Eligible" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: CertStatus) {
  switch (status) {
    case "Eligible":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
          Eligible
        </Badge>
      );
    case "Issued":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100">
          <CheckCircle2 className="size-3 mr-1" /> Issued
        </Badge>
      );
    case "Pending":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Pending
        </Badge>
      );
  }
}

// ── Toast notification ────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: "success" | "error" }

function ToastList({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg animate-in slide-in-from-right-4 pointer-events-auto",
            t.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          )}
        >
          {t.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const [records, setRecords] = useState<CertRecord[]>(INITIAL_DATA);
  const [issuing, setIssuing] = useState<Set<string>>(new Set());
  const [bulkIssuing, setBulkIssuing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // Issue a single certificate
  const handleIssue = (id: string) => {
    setIssuing((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "Issued", certificateId: `CST-2026-COOP-${Math.floor(10000 + Math.random() * 89999)}` }
            : r
        )
      );
      setIssuing((prev) => { const s = new Set(prev); s.delete(id); return s; });
      const name = records.find((r) => r.id === id)?.trainee ?? "Trainee";
      addToast(`Certificate issued to ${name} successfully.`, "success");
    }, 1400);
  };

  // Bulk issue all eligible
  const handleBulkIssue = () => {
    const eligible = records.filter((r) => r.status === "Eligible");
    if (eligible.length === 0) { addToast("No eligible trainees to issue certificates to.", "error"); return; }
    setBulkIssuing(true);
    setIssuing(new Set(eligible.map((r) => r.id)));
    setTimeout(() => {
      setRecords((prev) =>
        prev.map((r) =>
          r.status === "Eligible"
            ? { ...r, status: "Issued", certificateId: `CST-2026-COOP-${Math.floor(10000 + Math.random() * 89999)}` }
            : r
        )
      );
      setIssuing(new Set());
      setBulkIssuing(false);
      addToast(`${eligible.length} certificate${eligible.length > 1 ? "s" : ""} issued successfully.`, "success");
    }, 2000);
  };

  const eligibleCount = records.filter((r) => r.status === "Eligible").length;
  const issuedCount   = records.filter((r) => r.status === "Issued").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Certificates"
        description="Issue and manage course completion certificates for your trainees."
        action={
          <Button
            onClick={handleBulkIssue}
            disabled={bulkIssuing || eligibleCount === 0}
            className="gap-2"
          >
            {bulkIssuing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Award className="size-4" />
            )}
            {bulkIssuing ? "Issuing…" : `Bulk Issue Eligible (${eligibleCount})`}
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <span className="size-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">Eligible:</span>
          <span className="font-semibold text-foreground">{eligibleCount}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Issued:</span>
          <span className="font-semibold text-foreground">{issuedCount}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <span className="size-2 rounded-full bg-muted-foreground" />
          <span className="text-muted-foreground">Pending:</span>
          <span className="font-semibold text-foreground">{records.filter((r) => r.status === "Pending").length}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Trainee Certification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainee</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium text-foreground">{cert.trainee}</TableCell>
                  <TableCell>{cert.course}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-medium",
                      cert.score >= 80 ? "text-emerald-600 dark:text-emerald-400"
                      : cert.score >= 60 ? "text-foreground"
                      : "text-amber-600 dark:text-amber-400"
                    )}>
                      {cert.score}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-medium",
                      cert.attendance >= 75 ? "text-foreground" : "text-red-600 dark:text-red-400"
                    )}>
                      {cert.attendance}%
                    </span>
                  </TableCell>
                  <TableCell>{statusBadge(cert.status)}</TableCell>
                  <TableCell className="text-right">
                    {cert.status === "Eligible" ? (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={issuing.has(cert.id)}
                        onClick={() => handleIssue(cert.id)}
                      >
                        {issuing.has(cert.id) ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="size-3.5" />
                        )}
                        {issuing.has(cert.id) ? "Issuing…" : "Issue"}
                      </Button>
                    ) : cert.status === "Issued" && cert.certificateId ? (
                      <Button variant="ghost" size="sm" className="gap-1.5" render={<Link href={`/verify-certificate/${cert.certificateId}`} />}>
                        <ExternalLink className="size-3.5" /> View
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
                        Pending
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ToastList toasts={toasts} />
    </div>
  );
}
