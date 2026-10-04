"use client";

import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { InstitutionForm } from "@/components/admin/institutions/institution-form";

export default function NewInstitutionPage() {
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground">Admin</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/admin/institutions" className="hover:text-foreground">Institutions</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground">Add Institution</span>
      </nav>
      <AdminPageHeader icon={Building2} title="Add Institution" description="Register a new training institution in the cooperative training network." />
      <InstitutionForm mode="create" />
    </div>
  );
}
