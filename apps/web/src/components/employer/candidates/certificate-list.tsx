import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type CandidateCertificate, formatDate } from "@/lib/employer/candidates-api";

const STATE_LABEL: Record<string, { label: string; className: string }> = {
  valid: { label: "Verified", className: "bg-success/10 text-success" },
  expired: { label: "Expired", className: "bg-warning/10 text-warning" },
  revoked: { label: "Revoked", className: "bg-destructive/10 text-destructive" },
  integrity_failed: { label: "Integrity check failed", className: "bg-destructive/10 text-destructive" },
  unverified: { label: "Not verified", className: "bg-muted text-muted-foreground" },
};

export function verificationBadge(state: string) {
  const entry = STATE_LABEL[state] ?? { label: state ? state.replace(/_/g, " ") : "Status not available", className: "bg-muted text-muted-foreground" };
  return <span className={cn("rounded-4xl px-2 py-0.5 text-[11px] font-semibold capitalize", entry.className)}>{entry.label}</span>;
}

/** Certificates with verification state. Verify opens the public certificate check for this verification code. */
export function CertificateList({ certificates }: { certificates: CandidateCertificate[] }) {
  if (certificates.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No certificates have been issued to this candidate.</p>;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {certificates.map((certificate) => (
        <li key={certificate.id}>
          <Card className="h-full py-4">
            <CardContent className="flex h-full flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading text-sm font-semibold text-foreground">{certificate.programme_title}</h3>
                {verificationBadge(certificate.verification_state)}
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Issuer</dt>
                  <dd className="text-foreground">{certificate.issuer || "Not available"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Issued</dt>
                  <dd className="text-foreground">{formatDate(certificate.issue_date)}</dd>
                </div>
              </dl>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="font-mono text-[11px] text-muted-foreground">{certificate.verification_code || "No code"}</span>
                {certificate.verification_code ? (
                  <a
                    href={`/verify-certificate/${encodeURIComponent(certificate.verification_code)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Verify
                    <ExternalLink />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">Verification code not available</span>
                )}
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
