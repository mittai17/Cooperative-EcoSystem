"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { InstitutionDetailView } from "@/components/admin/institutions/institution-detail-view";

export default function AdminInstitutionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted/70" aria-busy="true" />}>
      <InstitutionDetailView key={id} id={id} />
    </Suspense>
  );
}
