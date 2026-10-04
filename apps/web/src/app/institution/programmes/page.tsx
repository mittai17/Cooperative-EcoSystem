"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Filter, CheckCircle2, X, Archive, Eye } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { institutionProgrammeSummary } from "@/lib/mock-data/dashboards";

interface ProgrammeSummaryItem {
  id: string;
  title: string;
  trainees: number;
  attendance: number;
  status: string;
}

function ProgrammesPageContent() {
  const searchParams = useSearchParams();
  const createdNotice = searchParams.get("created");

  const [programmes, setProgrammes] = useState<ProgrammeSummaryItem[]>(institutionProgrammeSummary);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Active" | "Archived">("All");
  const [notice, setNotice] = useState<string | null>(
    createdNotice ? "New programme created and published successfully!" : null
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem("coopsetu_institution_programmes");
      if (stored) {
        const customProgs = JSON.parse(stored) as { id: string; title: string; trainees?: number; attendance?: number; status?: string }[];
        const customFormatted: ProgrammeSummaryItem[] = customProgs.map((cp) => ({
          id: cp.id,
          title: cp.title,
          trainees: cp.trainees ?? 0,
          attendance: cp.attendance ?? 100,
          status: cp.status ?? "Active",
        }));
        const existingIds = new Set(customFormatted.map((c) => c.id));
        setProgrammes([...customFormatted, ...institutionProgrammeSummary.filter((p) => !existingIds.has(p.id))]);
      }
    } catch {}
  }, []);

  const handleToggleArchive = (id: string) => {
    const prog = programmes.find((p) => p.id === id);
    const newStatus = prog?.status === "Active" ? "Archived" : "Active";
    const updated = programmes.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
    setProgrammes(updated);
    try {
      const stored = localStorage.getItem("coopsetu_institution_programmes");
      if (stored) {
        const customProgs = JSON.parse(stored) as ProgrammeSummaryItem[];
        const customUpdated = customProgs.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
        localStorage.setItem("coopsetu_institution_programmes", JSON.stringify(customUpdated));
      } else {
        // If it's a default programme that was archived, save the updated state
        localStorage.setItem("coopsetu_institution_programmes", JSON.stringify(updated));
      }
    } catch {}
    setNotice(`"${prog?.title}" marked as ${newStatus}.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const filtered = useMemo(() => {
    return programmes.filter((p) => {
      if (filter !== "All" && p.status !== filter) return false;
      if (query.trim() && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [programmes, filter, query]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Programmes"
        description="Manage your training programmes, cohorts, curriculum, and batch enrolment."
        action={
          <Button render={<Link href="/institution/programmes/create" />}><Plus className="mr-1.5 size-4" /> Create Programme</Button>
        }
      />

      {notice && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <AlertDescription className="text-xs sm:text-sm font-medium">{notice}</AlertDescription>
          </div>
          <button onClick={() => setNotice(null)} className="text-xs text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-2">
            <CardTitle className="font-heading text-base">All Programmes ({filtered.length})</CardTitle>
            <div className="flex items-center gap-1">
              {(["All", "Active", "Archived"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search programmes..."
              className="pl-8 text-xs h-8"
            />
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>Enrolled Trainees</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((programme) => (
                <TableRow key={programme.id}>
                  <TableCell className="font-medium text-foreground">{programme.title}</TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>{programme.trainees}</TableCell>
                  <TableCell>{programme.attendance}%</TableCell>
                  <TableCell>
                    <Badge variant={programme.status === "Active" ? "secondary" : "outline"}>
                      {programme.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" render={<Link href={`/courses/${programme.id}`} />}><Eye className="size-3.5 mr-1" /> View</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleArchive(programme.id)}
                        className={programme.status === "Active" ? "text-destructive hover:bg-destructive/10" : "text-primary"}
                      >
                        <Archive className="size-3.5 mr-1" />
                        {programme.status === "Active" ? "Archive" : "Restore"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                    No programmes found. Click &quot;Create Programme&quot; above to publish one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProgrammesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-sm">Loading programmes...</div>}>
      <ProgrammesPageContent />
    </Suspense>
  );
}
