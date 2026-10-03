import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Building2, ExternalLink, Mail, MapPin, Pencil, Phone } from "lucide-react";
import type { Institution } from "@/lib/admin/admin-api";
import { formatCount } from "@/components/admin/dashboard/format";
import { StatusPill } from "@/components/admin/shared/status-pill";

function Field({ label, children, icon: Icon }: { label: string; children: ReactNode; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-right text-sm font-medium text-foreground break-words">{children}</dd>
    </div>
  );
}

export function InstitutionOverviewFields({ institution }: { institution: Institution }) {
  return (
    <dl className="divide-y divide-border">
      <Field label="Type" icon={Building2}>{institution.type}</Field>
      <Field label="State" icon={MapPin}>{institution.state ?? "—"}</Field>
      <Field label="District" icon={MapPin}>{institution.district ?? "—"}</Field>
      <Field label="Address" icon={MapPin}>{institution.address ?? "—"}</Field>
      <Field label="Pincode" icon={MapPin}>{institution.pincode ?? "—"}</Field>
      <Field label="Accreditation No." icon={Building2}>{institution.accreditation_number ?? "—"}</Field>
      <Field label="Total Trainers" icon={Building2}>{formatCount(institution.trainers)}</Field>
      <Field label="Total Trainees" icon={Building2}>{formatCount(institution.trainees)}</Field>
      <Field label="Programmes" icon={Building2}>{formatCount(institution.programmes)}</Field>
      <Field label="Contact email" icon={Mail}>
        {institution.email ? <a href={`mailto:${institution.email}`} className="text-primary hover:underline">{institution.email}</a> : "—"}
      </Field>
      <Field label="Phone" icon={Phone}>{institution.phone ?? "—"}</Field>
      <Field label="Website" icon={ExternalLink}>
        {institution.website ? (
          <a href={institution.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {institution.website.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          "—"
        )}
      </Field>
    </dl>
  );
}

export function InstitutionProfilePanel({ institution, onViewDetails }: { institution: Institution; onViewDetails?: () => void }) {
  const detailHref = `/admin/institutions/${encodeURIComponent(institution.id)}`;
  return (
    <aside className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-label="Institution profile">
      <div className="relative h-36 bg-tint-blue-bg/60">
        <div className="absolute inset-0 flex items-center justify-center text-tint-blue-fg/40">
          <Building2 className="size-14" aria-hidden />
        </div>
        <span className="absolute top-3 right-3">
          <StatusPill status={institution.status} />
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">{institution.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-tint-blue-bg px-2.5 py-1 font-medium text-tint-blue-fg">{institution.type}</span>
            {institution.state ? (
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
                {[institution.district, institution.state].filter(Boolean).join(", ")}
              </span>
            ) : null}
          </div>
        </div>
        <InstitutionOverviewFields institution={institution} />
        <div className="flex flex-col gap-2.5 pt-2">
          {onViewDetails ? (
            <button
              type="button"
              onClick={onViewDetails}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              View Details
            </button>
          ) : (
            <Link
              href={detailHref}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              View Details
            </Link>
          )}
          <Link
            href={`${detailHref}/edit`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary px-4 text-sm font-medium text-primary hover:bg-tint-red-bg/50"
          >
            <Pencil className="size-4" aria-hidden />
            Edit Institution
          </Link>
        </div>
      </div>
    </aside>
  );
}
