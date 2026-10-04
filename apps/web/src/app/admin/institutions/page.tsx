"use client";

import { Suspense } from "react";
import { InstitutionsListView } from "@/components/admin/institutions/institutions-list-view";

export default function AdminInstitutionsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted/70" aria-busy="true" />}>
      <InstitutionsListView />
    </Suspense>
  );
}
