"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Pencil, Building2, ExternalLink } from "lucide-react";

import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { formatCount } from "@/components/admin/dashboard/format";
import { getInstitution, type Institution } from "@/lib/admin/admin-api";
import { cn } from "@/lib/utils";

import { DEMO_INSTITUTIONS } from "./constants";
import { InstitutionLogo } from "./institution-logo";
import { InstitutionOverviewFields, InstitutionProfilePanel } from "./institution-detail-panel";
import { normaliseInstitutionStatus } from "./institution-status";

const TABS = ["Overview", "Programs", "Trainers", "Trainees", "Placements", "Settings"] as const;
type Tab = (typeof TABS)[number];

const TAB_TARGETS: Record<Exclude<Tab, "Overview" | "Settings">, { href: string; label: string; count: (i: Institution) => number; noun: string }> = {
  Programs: { href: "/admin/programmes", label: "Open Training Programs", count: (i) => i.programmes, noun: "programmes" },
  Trainers: { href: "/admin/trainers", label: "Open Trainers", count: (i) => i.trainers, noun: "trainers" },
  Trainees: { href: "/admin/trainees", label: "Open Trainees", count: (i) => i.trainees, noun: "trainees" },
  Placements: { href: "/admin/jobs-placements", label: "Open Jobs & Placements", count: () => 0, noun: "placements" },
};

function initialTab(raw: string | null): Tab {
  const match = TABS.find((t) => t.toLowerCase() === (raw ?? "").toLowerCase());
  return match ?? "Overview";
}

export function InstitutionDetailView({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "demo" | "missing">("loading");
  const [tab, setTab] = useState<Tab>(() => initialTab(searchParams.get("tab")));
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getInstitution(id)
      .then((row) => {
        if (cancelled) return;
        setInstitution(row);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        const matched = id
          ? DEMO_INSTITUTIONS.find(
              (row) => row.id === id || (id.startsWith("i") && row.id === `demo-${id.slice(1)}`),
            )
          : null;
        if (matched) {
          setInstitution(matched);
          setStatus("demo");
        } else {
          setStatus("missing");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading institution">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-muted/70" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
        <div className="h-80 animate-pulse rounded-2xl bg-muted/70" />
      </div>
    );
  }

  if (status === "missing" || !institution) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <AlertTriangle className="size-8 text-amber-600" aria-hidden />
        <p className="font-semibold text-foreground">Institution not found</p>
        <p className="text-sm text-muted-foreground">The requested institution does not exist or may have been removed.</p>
        <Link href="/admin/institutions" className="mt-2 text-sm font-medium text-primary hover:underline">
          Back to institutions
        </Link>
      </div>
    );
  }

  const editHref = `/admin/institutions/${encodeURIComponent(institution.id)}/edit`;
  const pillStatus = normaliseInstitutionStatus(institution.status);

  return (
    <div className="flex flex-col gap-6">
      {status === "demo" ? <DemoBanner message="Live record unavailable. Showing a fictional sample institution." /> : null}

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <InstitutionLogo name={institution.name} className="size-14 text-sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-xl font-bold text-foreground">{institution.name}</h1>
              <StatusPill status={pillStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {[institution.type, [institution.district, institution.state].filter(Boolean).join(", ")]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <Link
          href={editHref}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          <Pencil className="size-4" aria-hidden />
          Edit
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section ref={contentRef} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div role="tablist" aria-label="Institution sections" className="flex overflow-x-auto border-b border-border px-2 sm:px-4">
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                onClick={() => setTab(item)}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-medium",
                  tab === item ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="p-5" role="tabpanel">
            {tab === "Overview" ? (
              <div className="flex flex-col gap-6">
                <InstitutionOverviewFields institution={institution} />
                <div>
                  <h2 className="mb-2 font-heading text-sm font-semibold text-foreground">Address</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {institution.address ?? "No address has been recorded for this institution yet."}
                  </p>
                </div>
              </div>
            ) : null}

            {tab === "Settings" ? (
              <div className="flex flex-col gap-4 text-sm">
                <p className="text-muted-foreground">
                  Current status is <span className="font-semibold text-foreground">{pillStatus.replace(/_/g, " ")}</span>.
                  Change the status, contact details or identifiers from the edit form.
                </p>
                <div>
                  <Link href={editHref} className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary px-4 font-medium text-primary hover:bg-tint-red-bg/50">
                    <Pencil className="size-4" aria-hidden />
                    Edit institution settings
                  </Link>
                </div>
              </div>
            ) : null}

            {tab in TAB_TARGETS
              ? (() => {
                  const target = TAB_TARGETS[tab as keyof typeof TAB_TARGETS];
                  return (
                    <div className="flex flex-col items-start gap-4 rounded-xl border border-border p-5">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-tint-red-bg text-tint-red-fg">
                        <Building2 className="size-5" aria-hidden />
                      </span>
                      <div>
                        <p className="font-heading text-2xl font-bold text-foreground">{formatCount(target.count(institution))}</p>
                        <p className="text-sm text-muted-foreground">{target.noun} linked to {institution.name}</p>
                      </div>
                      <Link
                        href={`${target.href}?institution=${encodeURIComponent(institution.id)}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        {target.label}
                        <ExternalLink className="size-3.5" aria-hidden />
                      </Link>
                    </div>
                  );
                })()
              : null}
          </div>
        </section>

        <InstitutionProfilePanel
          institution={institution}
          onViewDetails={() => {
            setTab("Overview");
            contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </div>
    </div>
  );
}
