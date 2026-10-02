import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  Fingerprint,
  GraduationCap,
  Hash,
  Info,
  QrCode,
  ShieldCheck,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { certificates } from "@/lib/mock-data/certificates";
import {
  certificateDetails,
  currentTrainee,
  verificationUrl,
  type CertifiedSkill,
} from "@/lib/mock-data/kiosk";
import type { CertificateStatus, EvidenceType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CertificateActions } from "./certificate-actions";

/* -------------------------------------------------------------------------- */
/* Status and evidence presentation                                           */
/* -------------------------------------------------------------------------- */

const STATUS_CONFIG: Record<
  CertificateStatus,
  { className: string; note: string }
> = {
  Valid: {
    className: "border-success/30 bg-success/10 text-success",
    note: "Active and inside its validity window.",
  },
  Expired: {
    className: "border-amber-300 bg-tint-amber-bg text-amber-800",
    note: "Issued in good standing, but the validity window has closed.",
  },
  Revoked: {
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    note: "Withdrawn by the issuing body. It no longer confers any skill recognition.",
  },
};

const EVIDENCE_ICON: Record<EvidenceType, typeof Award> = {
  Course: GraduationCap,
  Assessment: BadgeCheck,
  Project: Award,
  "Employer Feedback": Building2,
};

/* -------------------------------------------------------------------------- */
/* Verification symbol                                                        */
/* -------------------------------------------------------------------------- */

/*
 * No QR encoder is bundled with this app and none may be added, so the payload
 * is drawn as a deterministic module grid instead: a FNV-1a hash of the payload
 * seeds a mulberry32 PRNG, and the result is rendered as SVG with the three
 * finder patterns and the two timing lines of a real symbol. It is a faithful
 * *visual* preview of the verification link, not a scannable symbol.
 */
const QR_MODULES = 25;

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Origin of the 7x7 finder pattern covering this cell, or null when outside all three. */
function finderOrigin(row: number, col: number): { row: number; col: number } | null {
  const last = QR_MODULES - 7;
  if (row < 7 && col < 7) return { row: 0, col: 0 };
  if (row < 7 && col >= last) return { row: 0, col: last };
  if (row >= last && col < 7) return { row: last, col: 0 };
  return null;
}

function finderBit(row: number, col: number, origin: { row: number; col: number }): boolean {
  const r = row - origin.row;
  const c = col - origin.col;
  const ring = r === 0 || c === 0 || r === 6 || c === 6;
  const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
  return ring || core;
}

/** Build one SVG sub-path per horizontal run of dark modules. */
function buildQrPath(payload: string): string {
  const random = mulberry32(fnv1a(payload));
  const grid: boolean[][] = [];
  for (let row = 0; row < QR_MODULES; row += 1) {
    const cells: boolean[] = [];
    for (let col = 0; col < QR_MODULES; col += 1) {
      const origin = finderOrigin(row, col);
      if (origin) {
        cells.push(finderBit(row, col, origin));
      } else if (row === 6 || col === 6) {
        // Timing lines: alternating modules starting dark on the even index.
        cells.push((row === 6 ? col : row) % 2 === 0);
      } else {
        cells.push(random() > 0.52);
      }
    }
    grid.push(cells);
  }

  const parts: string[] = [];
  grid.forEach((cells, row) => {
    let col = 0;
    while (col < cells.length) {
      if (!cells[col]) {
        col += 1;
        continue;
      }
      let run = 1;
      while (col + run < cells.length && cells[col + run]) run += 1;
      parts.push(`M${col} ${row}h${run}v1h-${run}z`);
      col += run;
    }
  });
  return parts.join("");
}

/* -------------------------------------------------------------------------- */
/* Small presentational pieces                                                */
/* -------------------------------------------------------------------------- */

function DetailRow({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string;
  value: string;
  icon: typeof Hash;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="icon-tile-red size-8 shrink-0">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("text-sm text-foreground", mono && "font-mono")}>{value}</p>
      </div>
    </div>
  );
}

function SkillBlock({ skill, index }: { skill: CertifiedSkill; index: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-heading text-base font-semibold text-foreground">
          {index + 1}. {skill.skill}
        </p>
        <Badge variant="secondary">Certified skill</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{skill.outcome}</p>
      <ul className="flex flex-col gap-2">
        {skill.evidence.map((record) => {
          const EvidenceIcon = EVIDENCE_ICON[record.type];
          return (
            <li key={`${record.type}-${record.title}`} className="flex items-start gap-2">
              <EvidenceIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm text-foreground">{record.title}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {record.type} · {record.date}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function UnavailableState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <Link className="contents" href="/certificates"><Button
          variant="ghost"
          size="sm"
          className="-ml-2 min-h-11"
          
         nativeButton={false}>
              <ArrowLeft className="size-4" />
              Back to certificates
            </Button></Link>
      </div>

      <PageHeader title={title} description="CoopSetu Skill Passport" />

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="icon-tile-red size-9 shrink-0">
              <Info className="size-4" />
            </span>
            <p className="text-sm text-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="contents" href="/certificates"><Button className="min-h-11"   nativeButton={false}>My certificates</Button></Link>
            <Link className="contents" href="/verify-certificate/CST-2026-DAI-00842"><Button
              variant="outline"
              className="min-h-11"
              
             nativeButton={false}>Verify a reference</Button></Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Certificate pages are visible only to the learner named on the document. Requests about a
            missing record go to your training coordinator.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function CertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const certificate = certificates[id];

  if (!certificate) {
    return (
      <UnavailableState
        title="Certificate not found"
        description="No certificate matches this reference. Check the ID printed on the document and try again."
      />
    );
  }

  if (certificate.holderName !== currentTrainee.legalName) {
    return (
      <UnavailableState
        title="Certificate not available"
        description="This reference is not linked to your learner account, so nothing about the record can be shown here."
      />
    );
  }

  const detail = certificateDetails[id];

  if (!detail) {
    return (
      <UnavailableState
        title="Certificate record incomplete"
        description="The certificate exists, but its registry detail has not been published yet. Ask your training coordinator to reissue it."
      />
    );
  }

  const status = STATUS_CONFIG[certificate.status];
  const publicUrl = verificationUrl(id);
  const qrPath = buildQrPath(publicUrl);
  const evidenceCount = detail.skills.reduce((total, skill) => total + skill.evidence.length, 0);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="print:hidden">
        <Link className="contents" href="/certificates"><Button
          variant="ghost"
          size="sm"
          className="-ml-2 min-h-11"
          
         nativeButton={false}>
              <ArrowLeft className="size-4" />
              Back to certificates
            </Button></Link>
      </div>

      <PageHeader
        title="Certificate detail"
        description={`${certificate.programmeTitle} · ${certificate.issuer}`}
        action={
          <Badge variant="secondary" className={cn("gap-1.5 px-2.5 py-1", status.className)}>
            <ShieldCheck className="size-3.5" />
            {certificate.status}
          </Badge>
        }
      />

      <Card className="print:shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <Award className="size-5 text-primary" />
            Certificate of completion
          </CardTitle>
          <CardDescription>
            {detail.assessmentBoard} · {status.note}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="rounded-lg border border-border bg-muted/40 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Awarded to
            </p>
            <p className="font-heading text-2xl font-bold text-foreground">{certificate.holderName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentTrainee.rollNo} · {currentTrainee.batch} · {currentTrainee.institution}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DetailRow label="Certificate ID" value={certificate.id} icon={Hash} mono />
            <DetailRow label="Registry reference" value={detail.ncctReference} icon={Fingerprint} mono />
            <DetailRow label="Learner code" value={detail.learnerCode} icon={User} mono />
            <DetailRow label="Programme code" value={detail.programmeCode} icon={GraduationCap} mono />
            <DetailRow label="Seat number" value={detail.seatNumber} icon={Hash} mono />
            <DetailRow label="Grade" value={certificate.grade} icon={Award} />
            <DetailRow label="Issued" value={certificate.issueDate} icon={CalendarDays} mono />
            <DetailRow
              label="Valid until"
              value={certificate.expiryDate ?? "No expiry"}
              icon={CalendarDays}
              mono
            />
            <DetailRow label="Duration" value={`${detail.durationHours} hours`} icon={GraduationCap} />
            <DetailRow label="Delivery mode" value={detail.deliveryMode} icon={Building2} />
            <DetailRow label="Coordinator" value={detail.coordinator} icon={User} />
            <DetailRow label="Issued by" value={certificate.issuer} icon={ShieldCheck} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 print:shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Certified skills and evidence</CardTitle>
            <CardDescription>
              {detail.skills.length} certified skills backed by {evidenceCount} assessment,
              project and employer records.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {detail.skills.map((skill, index) => (
              <SkillBlock key={skill.skill} skill={skill} index={index} />
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Verify this certificate</CardTitle>
              <CardDescription>
                The public page needs no sign-in and repeats the registry anchors below.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="mx-auto w-fit rounded-lg border border-border bg-white p-3">
                <svg
                  viewBox={`0 0 ${QR_MODULES} ${QR_MODULES}`}
                  width={168}
                  height={168}
                  role="img"
                  aria-label={`Visual preview of the verification link for ${certificate.id}`}
                  shapeRendering="crispEdges"
                >
                  <rect width={QR_MODULES} height={QR_MODULES} fill="#ffffff" />
                  <path d={qrPath} fill="#0f172a" />
                </svg>
              </div>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <QrCode className="mt-0.5 size-3.5 shrink-0" />
                This is a deterministic visual preview of the link below, drawn with the same
                FNV-1a and mulberry32 technique used elsewhere in the app. It is not a scannable QR
                symbol, so use the printed URL to verify.
              </p>
              <Separator />
              <CertificateActions
                certificateId={certificate.id}
                holderName={certificate.holderName}
                programmeTitle={certificate.programmeTitle}
                verificationUrl={publicUrl}
              />
            </CardContent>
          </Card>

          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Registry anchors</CardTitle>
              <CardDescription>Immutable values printed in the verification block.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {detail.anchors.map((anchor) => (
                <div key={anchor.label} className="flex flex-col gap-0.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {anchor.label}
                  </p>
                  <p className="font-mono text-xs text-foreground">{anchor.value}</p>
                </div>
              ))}
              <Separator />
              <Link className="contents" href={`/verify-certificate/${certificate.id}`}><Button
                variant="outline"
                className="min-h-11"
                
               nativeButton={false}>Open public page</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

