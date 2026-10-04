"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Calendar, FileText, CheckCircle2, Trash2, X, Plus } from "lucide-react";
import { useT } from "@/i18n";

interface ApplicationItem {
  id: string | number;
  jobId?: string;
  title: string;
  employer: string;
  date: string;
  status: string;
  location?: string;
}

const DEFAULT_APPLICATIONS: ApplicationItem[] = [
  { id: 1, jobId: "job-amul-01", title: "Dairy Procurement Supervisor", employer: "Amul Dairy Cooperative Union", date: "2026-09-15", status: "Interview" },
  { id: 2, jobId: "job-vaikunth-01", title: "Cooperative Society Accountant", employer: "Vaikunth Cooperative Credit Society", date: "2026-09-10", status: "Shortlisted" },
  { id: 3, jobId: "job-navbharat-01", title: "Junior Loan Officer", employer: "Navbharat Credit Coop", date: "2026-09-01", status: "Applied" },
  { id: 4, jobId: "job-ncdc-01", title: "Data Analyst", employer: "National Cooperative Dev Corp", date: "2026-08-20", status: "Rejected" },
];

export default function ApplicationsPage() {
  const t = useT();
  const [list, setList] = useState<ApplicationItem[]>(DEFAULT_APPLICATIONS);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("coopsetu_applications");
      if (stored) {
        const parsed = JSON.parse(stored) as ApplicationItem[];
        // Filter out any duplicates against default items by jobId or title
        const existingTitles = new Set(parsed.map((p) => p.title));
        const combined = [...parsed, ...DEFAULT_APPLICATIONS.filter((d) => !existingTitles.has(d.title))];
        setList(combined);
      }
    } catch {}
  }, []);

  const handleWithdraw = (id: string | number) => {
    const app = list.find((a) => a.id === id);
    const next = list.filter((a) => a.id !== id);
    setList(next);

    try {
      const stored = localStorage.getItem("coopsetu_applications");
      if (stored) {
        const parsed = JSON.parse(stored) as ApplicationItem[];
        const filteredStored = parsed.filter((a) => a.id !== id);
        localStorage.setItem("coopsetu_applications", JSON.stringify(filteredStored));
      }
    } catch {}

    setNotice(t("trainee.applications.withdrawn").replace("{title}", app?.title ?? ""));
    setTimeout(() => setNotice(null), 4000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Interview":
        return <Badge className="bg-primary/20 text-primary hover:bg-primary/30">{t("trainee.common.interviewing")}</Badge>;
      case "Shortlisted":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">{t("trainee.common.shortlisted")}</Badge>;
      case "Applied":
        return <Badge variant="secondary">{t("trainee.common.applied")}</Badge>;
      case "Rejected":
        return <Badge variant="destructive">{t("trainee.common.rejected")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const totalApplied = list.length;
  const shortlisted = list.filter((a) => a.status === "Shortlisted").length;
  const interviews = list.filter((a) => a.status === "Interview").length;
  const offers = list.filter((a) => a.status === "Offered").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("trainee.applications.title")}
        description={t("trainee.applications.description")}
        action={
          <Link className="contents" href="/trainee/jobs"><Button nativeButton={false}><Plus className="mr-1.5 size-4" /> {t("trainee.applications.exploreJobs")}</Button></Link>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("trainee.applications.totalApplied")}</span>
            <span className="text-3xl font-bold mt-1 text-foreground">{totalApplied}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("trainee.common.shortlisted")}</span>
            <span className="text-3xl font-bold mt-1 text-emerald-600">{shortlisted}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("trainee.applications.interviews")}</span>
            <span className="text-3xl font-bold mt-1 text-primary">{interviews}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("trainee.applications.offers")}</span>
            <span className="text-3xl font-bold mt-1 text-foreground">{offers}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">{t("trainee.applications.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">{t("trainee.applications.colJob")}</th>
                  <th className="px-4 py-3">{t("trainee.applications.colDate")}</th>
                  <th className="px-4 py-3">{t("trainee.common.status")}</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">{t("trainee.common.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      <p className="text-sm font-medium">No applications found.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 text-xs"
                        onClick={() => setList(DEFAULT_APPLICATIONS)}
                      >
                        Reset Demo Applications
                      </Button>
                    </td>
                  </tr>
                ) : (
                  list.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{app.title}</span>
                          <span className="text-xs text-muted-foreground flex items-center mt-1">
                            <Building2 className="size-3 mr-1" /> {app.employer}
                            {app.location && <span className="ml-2">&middot; {app.location}</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <div className="flex items-center text-xs">
                          <Calendar className="size-3 mr-1.5" /> {app.date}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link className="contents" href="/trainee/jobs"><Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}><FileText className="size-3.5 mr-1" /> {t("trainee.common.view")}</Button></Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWithdraw(app.id)}
                            className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title={t("trainee.applications.withdraw")}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
