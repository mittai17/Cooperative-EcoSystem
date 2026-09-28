import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { certificates, sampleCertificateId } from "@/lib/mock-data/certificates";
import type { CertificateStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CertificateSearchForm } from "./certificate-search-form";

const statusConfig: Record<
  CertificateStatus,
  { icon: typeof ShieldCheck; className: string; message: string }
> = {
  Valid: {
    icon: ShieldCheck,
    className: "border-success/30 bg-success/5 text-success",
    message: "This certificate is authentic and currently valid.",
  },
  Expired: {
    icon: ShieldAlert,
    className: "border-warning/30 bg-warning/5 text-warning",
    message: "This certificate was authentic but has since expired.",
  },
  Revoked: {
    icon: ShieldX,
    className: "border-destructive/30 bg-destructive/5 text-destructive",
    message: "This certificate has been revoked by the issuing institution.",
  },
};

export default async function VerifyCertificatePage({
  params,
}: PageProps<"/verify-certificate/[id]">) {
  const { id } = await params;
  const certificate = certificates[id];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BadgeCheck className="size-6" />
        </span>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Certificate Verification</h1>
        <p className="text-muted-foreground">
          Check the authenticity and validity of any CoopSetu AI-issued certificate using its unique ID.
        </p>
      </div>

      <CertificateSearchForm initialId={id} />
      <div className="mx-auto mt-3 flex max-w-md justify-center">
        <Button
          variant="link"
          size="sm"
          render={<Link href={`/verify-certificate/${sampleCertificateId}`}>Try the sample certificate</Link>}
        />
      </div>

      <div className="mt-8">
        {certificate ? (
          <Card>
            <CardHeader>
              <div className={cn("flex items-center gap-2 rounded-md border p-3 text-sm font-medium", statusConfig[certificate.status].className)}>
                {(() => {
                  const Icon = statusConfig[certificate.status].icon;
                  return <Icon className="size-4.5 shrink-0" />;
                })()}
                {statusConfig[certificate.status].message}
              </div>
              <CardTitle className="mt-4 font-heading text-xl">{certificate.programmeTitle}</CardTitle>
              <CardDescription>Certificate ID: {certificate.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Certificate holder</p>
                    <p className="text-sm font-medium text-foreground">{certificate.holderName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Issuing institution</p>
                    <p className="text-sm font-medium text-foreground">{certificate.issuer}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Issue date</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(certificate.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {certificate.expiryDate && (
                  <div className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Valid until</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(certificate.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Grade</p>
                <p className="text-sm font-medium text-foreground">{certificate.grade}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Skills certified</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {certificate.skillsCertified.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <ShieldAlert className="size-8 text-muted-foreground" />
              <p className="font-medium text-foreground">No certificate found for &ldquo;{id}&rdquo;</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Double-check the certificate ID printed on the document, or try the sample certificate
                below.
              </p>
              <Button
                variant="outline"
                className="mt-2"
                render={<Link href={`/verify-certificate/${sampleCertificateId}`}>View sample certificate</Link>}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
