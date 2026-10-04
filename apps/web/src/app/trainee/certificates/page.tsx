import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { certificates } from "@/lib/mock-data/certificates";
import { traineeProfile } from "@/lib/trainee/identity";
import { traineeCertificateDetails } from "@/lib/trainee/certificate-registry";
import Link from "next/link";
import { Award, CalendarClock, Download, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  Valid: "bg-success/10 text-success",
  Expired: "bg-amber-100 text-amber-800",
  Revoked: "bg-destructive/10 text-destructive",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Fixed at module load so the server render and the client hydrate agree. */
const AS_ON = new Date();

function validityPercent(issueDate: string, expiryDate?: string): number {
  if (!expiryDate) return 100;
  const start = new Date(issueDate).getTime();
  const end = new Date(expiryDate).getTime();
  const span = end - start;
  if (span <= 0) return 0;
  const used = AS_ON.getTime() - start;
  return Math.max(0, Math.min(100, Math.round((used / span) * 100)));
}

export default function CertificatesPage() {
  const owned = Object.values(certificates).filter(
    (certificate) => certificate.holderName === traineeProfile.legalName,
  );

  const certifiedSkills = new Set(
    owned.flatMap((certificate) => certificate.skillsCertified),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Certificates"
        description="View and download your verified certificates."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Award className="size-5" />
            </span>
            <div>
              <p className="font-heading text-2xl font-bold text-foreground">{owned.length}</p>
              <p className="text-sm text-muted-foreground">Credentials issued</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <span className="flex size-11 items-center justify-center rounded-md bg-success/10 text-success">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="font-heading text-2xl font-bold text-foreground">
                {owned.filter((certificate) => certificate.status === "Valid").length} / {owned.length}
              </p>
              <p className="text-sm text-muted-foreground">Currently valid</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <span className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <CalendarClock className="size-5" />
            </span>
            <div>
              <p className="font-heading text-2xl font-bold text-foreground">{certifiedSkills.size}</p>
              <p className="text-sm text-muted-foreground">Skills certified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {owned.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <p className="text-base font-semibold">No certificates issued yet</p>
          <p className="text-sm mt-1">Complete your enrolled programmes and assessments to receive certified credentials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {owned.map((c) => {
            const detail = traineeCertificateDetails[c.id];
            const used = validityPercent(c.issueDate, c.expiryDate);
            return (
              <Card key={c.id} className="flex flex-col">
                <CardHeader>
                  <Link href={`/trainee/certificates/${c.id}`} className="hover:underline">
                    <CardTitle className="text-lg leading-tight text-foreground">{c.programmeTitle}</CardTitle>
                  </Link>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2">
                  <p className="text-sm text-muted-foreground">Issued by: {c.issuer}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span>Issue Date:</span>
                    <span className="font-medium">{formatDate(c.issueDate)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Valid Until:</span>
                    <span className="font-medium">{c.expiryDate ? formatDate(c.expiryDate) : "No expiry"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Grade:</span>
                    <span className="font-medium">{c.grade}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 text-sm">
                    <span>ID:</span>
                    <span className="font-mono text-xs">{c.id}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {c.skillsCertified.map((skill) => (
                      <span
                        key={skill}
                        className={cn(
                          "rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground",
                          detail?.skills.some((entry) => entry.skill === skill) && "bg-primary/10 text-primary",
                        )}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  {c.expiryDate && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Validity window used</span>
                        <span>{used}%</span>
                      </div>
                      <Progress value={used} className="h-1.5" />
                    </div>
                  )}
                  <div className="mt-2">
                    <Badge
                      variant="secondary"
                      className={cn("border-none", STATUS_TONE[c.status] ?? "bg-muted text-muted-foreground")}
                    >
                      {c.status}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="mt-4 flex flex-wrap gap-2">
                  <Button render={<Link href={`/trainee/certificates/${c.id}`} />} variant="outline" className="flex-1 min-w-[90px]" size="sm">
                    Details
                  </Button>
                  <Button render={<Link href={`/verify-certificate/${c.id}?print=1`} />} variant="outline" className="flex-1 min-w-[90px]" size="sm">
                    <Download className="mr-1.5 size-3.5" /> Download
                  </Button>
                  <Button render={<Link href={`/verify-certificate/${c.id}`} />} variant="secondary" className="flex-1 min-w-[90px]" size="sm">
                    <ShieldCheck className="mr-1.5 size-3.5" /> Verify
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}