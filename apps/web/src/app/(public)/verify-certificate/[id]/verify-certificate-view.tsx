"use client";

import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  ExternalLink,
  Fingerprint,
  GraduationCap,
  Hash,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Sparkles,
  User,
  type LucideIcon,
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
import { Separator } from "@/components/ui/separator";
import { certificates, sampleCertificateId } from "@/lib/mock-data/certificates";
import type { CertificateStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { CertificateSearchForm } from "./certificate-search-form";
import { CertificatePrintButton } from "./certificate-print-button";

const QR_MODULES = 21;
function fnv1a(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function buildQr(payload: string): string {
  const rng = mulberry(fnv1a(payload));
  const grid = Array.from({ length: QR_MODULES }, (_, r) =>
    Array.from({ length: QR_MODULES }, (_, c) => {
      const last = QR_MODULES - 7;
      const inFinder = (r < 7 && c < 7) || (r < 7 && c >= last) || (r >= last && c < 7);
      if (inFinder) {
        const br = r < 7 ? 0 : last;
        const bc = c < 7 ? 0 : last;
        const lr = r - br; const lc = c - bc;
        return (lr === 0 || lc === 0 || lr === 6 || lc === 6) || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      }
      if (r === 6 || c === 6) return (r === 6 ? c : r) % 2 === 0;
      return rng() > 0.5;
    })
  );
  return grid.flatMap((row, r) => {
    const parts: string[] = []; let c = 0;
    while (c < row.length) {
      if (!row[c]) { c++; continue; }
      let run = 1;
      while (c + run < row.length && row[c + run]) run++;
      parts.push(`M${c} ${r}h${run}v1h-${run}z`);
      c += run;
    }
    return parts;
  }).join("");
}

/* -------------------------------------------------------------------------- */
/*  Status config                                                              */
/* -------------------------------------------------------------------------- */

const statusConfig: Record<
  CertificateStatus,
  {
    icon: LucideIcon;
    colorClass: string;
    bgClass: string;
    badgeClass: string;
    labelKey: string;
    messageKey: string;
    barClass: string;
  }
> = {
  Valid: {
    icon: ShieldCheck,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    labelKey: "public.verify.status.valid.label",
    messageKey: "public.verify.status.valid.message",
    barClass: "bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600",
  },
  Expired: {
    icon: ShieldAlert,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    labelKey: "public.verify.status.expired.label",
    messageKey: "public.verify.status.expired.message",
    barClass: "bg-gradient-to-r from-amber-400 to-amber-600",
  },
  Revoked: {
    icon: ShieldX,
    colorClass: "text-red-600 dark:text-red-400",
    bgClass: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    labelKey: "public.verify.status.revoked.label",
    messageKey: "public.verify.status.revoked.message",
    barClass: "bg-gradient-to-r from-red-400 to-red-600",
  },
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function certHash(id: string): string {
  let h = fnv1a(id + "NCCT-APEX-2026");
  const parts: string[] = [];
  for (let i = 0; i < 4; i++) {
    parts.push(h.toString(16).padStart(8, "0"));
    h = fnv1a(h.toString() + i);
  }
  return parts.join("").toUpperCase();
}

/* -------------------------------------------------------------------------- */
/*  View                                                                       */
/* -------------------------------------------------------------------------- */

export function VerifyCertificateView({ id }: { id: string }) {
  const t = useT();
  const certificate = certificates[id];
  const qrPath = certificate ? buildQr(`${certificate.id}|${certificate.issueDate}|NCCT`) : "";
  const hash = certificate ? certHash(certificate.id) : "";
  const [bodyBefore, bodyAfter] = t("public.verify.body").split("{ledger}");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/10 text-primary">
          <BadgeCheck className="size-7" />
        </span>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          {t("public.verify.title")}
        </h1>
        <p className="max-w-md text-muted-foreground text-sm">
          {bodyBefore}<strong>NCCT Apex Ledger</strong>{bodyAfter}
        </p>
      </div>

      {/* Search */}
      <CertificateSearchForm initialId={id} />
      <div className="mx-auto mt-2 flex max-w-md justify-center">
        <Link className="contents" href={`/verify-certificate/${sampleCertificateId}`}>
          <Button variant="link" size="sm" nativeButton={false}>
            {t("public.verify.trySample")}
          </Button>
        </Link>
      </div>

      {/* Result */}
      <div className="mt-8">
        {certificate ? (
          <>
            {/* Status banner */}
            {(() => {
              const cfg = statusConfig[certificate.status];
              const Icon = cfg.icon;
              return (
                <div className={cn("mb-5 flex items-start gap-3 rounded-xl border p-4", cfg.bgClass)}>
                  <Icon className={cn("size-5 shrink-0 mt-0.5", cfg.colorClass)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-semibold text-sm", cfg.colorClass)}>{t(cfg.labelKey)}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{t(cfg.messageKey)}</p>
                  </div>
                  <span className={cn("shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", cfg.badgeClass)}>
                    <Fingerprint className="size-3" />
                    {certificate.status}
                  </span>
                </div>
              );
            })()}

            {/* Certificate card */}
            <Card className="overflow-hidden print:shadow-none">
              {/* Top accent bar */}
              <div className={cn("h-1.5 w-full", statusConfig[certificate.status].barClass)} />

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-heading text-xl leading-tight">
                      {certificate.programmeTitle}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1.5">
                      <Hash className="size-3.5" />
                      {t("public.verify.certificateId")} <span className="font-mono font-medium">{certificate.id}</span>
                    </CardDescription>
                  </div>
                  {/* Inline QR */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="rounded-lg border border-border bg-white p-1.5 shadow-sm">
                      <svg
                        viewBox={`0 0 ${QR_MODULES} ${QR_MODULES}`}
                        width={72} height={72}
                        role="img"
                        aria-label={t("public.verify.qrAlt")}
                        shapeRendering="crispEdges"
                      >
                        <rect width={QR_MODULES} height={QR_MODULES} fill="#fff" />
                        <path d={qrPath} fill="#0f172a" />
                      </svg>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-mono">{t("public.verify.scanToVerify")}</p>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="space-y-6 pt-5">
                {/* Fields grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5">
                    <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("public.verify.fields.holder")}</p>
                      <p className="text-sm font-semibold text-foreground">{certificate.holderName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("public.verify.fields.issuer")}</p>
                      <p className="text-sm font-medium text-foreground">{certificate.issuer}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("public.verify.fields.issueDate")}</p>
                      <p className="text-sm font-medium text-foreground">{fmtDate(certificate.issueDate)}</p>
                    </div>
                  </div>
                  {certificate.expiryDate && (
                    <div className="flex items-start gap-2.5">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("public.verify.fields.validUntil")}</p>
                        <p className={cn(
                          "text-sm font-medium",
                          certificate.status === "Expired" ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                        )}>
                          {fmtDate(certificate.expiryDate)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <Award className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("public.verify.fields.grade")}</p>
                      <p className="text-sm font-semibold text-foreground">{certificate.grade}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <GraduationCap className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("public.verify.fields.programme")}</p>
                      <p className="text-sm font-medium text-foreground">{certificate.programmeTitle}</p>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Sparkles className="size-3" /> {t("public.verify.skillsCertified")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {certificate.skillsCertified.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Cryptographic verification block */}
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="size-4 text-primary" />
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {t("public.verify.crypto.title")}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{t("public.verify.crypto.hash")}</p>
                      <p className="font-mono text-[11px] text-foreground break-all mt-0.5 leading-relaxed">
                        {hash.match(/.{1,8}/g)?.join(" ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{t("public.verify.crypto.algorithm")}</p>
                        <p className="font-mono text-[11px] text-foreground">SHA-256 / ECDSA-P256</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{t("public.verify.crypto.registry")}</p>
                        <p className="font-mono text-[11px] text-foreground">NCCT Apex Ledger v3.1</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{t("public.verify.crypto.issuerDid")}</p>
                        <p className="font-mono text-[11px] text-foreground">did:ncct:0x{fnv1a(certificate.issuer).toString(16).padStart(8, "0").toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 print:hidden">
                  <CertificatePrintButton />
                  <Link className="contents" href={`/trainee/certificates/${certificate.id}`}>
                    <Button variant="outline" size="sm" className="gap-2" nativeButton={false}>
                      <ExternalLink className="size-4" /> {t("public.verify.viewFull")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Security watermark */}
            <p className="mt-4 text-center text-[11px] text-muted-foreground" suppressHydrationWarning>
              {t("public.verify.watermark").replace(
                "{date}",
                new Date().toLocaleString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                }),
              )}
            </p>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <ShieldAlert className="size-10 text-muted-foreground" />
              <div>
                <p className="font-semibold text-foreground">{t("public.verify.notFound.title").replace("{id}", id)}</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {t("public.verify.notFound.body")}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {Object.keys(certificates).map((cid) => (
                  <Link key={cid} className="contents" href={`/verify-certificate/${cid}`}>
                    <Button variant="outline" size="sm" nativeButton={false} className="font-mono text-xs">
                      {cid}
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
