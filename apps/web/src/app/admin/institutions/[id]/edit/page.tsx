"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ChevronRight, Pencil } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { InstitutionForm } from "@/components/admin/institutions/institution-form";
import { DEMO_INSTITUTIONS } from "@/components/admin/institutions/constants";
import { getInstitution, type Institution } from "@/lib/admin/admin-api";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; institution: Institution; demo: boolean }
  | { status: "missing" };

export default function EditInstitutionPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getInstitution(id)
      .then((institution) => {
        if (!cancelled) setState({ status: "ready", institution, demo: false });
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = DEMO_INSTITUTIONS.find((row) => row.id === id);
        setState(fallback ? { status: "ready", institution: fallback, demo: true } : { status: "missing" });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const backHref = `/admin/institutions/${encodeURIComponent(id)}`;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground">Admin</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/admin/institutions" className="hover:text-foreground">Institutions</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground">Edit</span>
      </nav>

      {state.status === "loading" ? (
        <div className="h-96 animate-pulse rounded-2xl bg-muted/70" aria-busy="true" aria-label="Loading institution" />
      ) : null}

      {state.status === "missing" ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <AlertTriangle className="size-8 text-amber-600" aria-hidden />
          <p className="font-semibold text-foreground">We could not load this institution.</p>
          <Link href="/admin/institutions" className="text-sm font-medium text-primary hover:underline">Back to institutions</Link>
        </div>
      ) : null}

      {state.status === "ready" ? (
        <>
          {state.demo ? <DemoBanner message="Live record unavailable. Changes cannot be saved in sample mode." /> : null}
          <AdminPageHeader icon={Pencil} title={`Edit ${state.institution.name}`} description="Update the registration details for this institution." />
          {state.demo ? (
            <p className="text-sm text-muted-foreground">
              <Link href={backHref} className="font-medium text-primary hover:underline">Return to the institution</Link>
            </p>
          ) : (
            <InstitutionForm mode="edit" institution={state.institution} />
          )}
        </>
      ) : null}
    </div>
  );
}
