"use client";

import { Building2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { InstitutionForm } from "@/components/admin/institutions/institution-form";

export default function NewInstitutionPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader icon={Building2} title="Add Institution" description="Register a new training institution in the cooperative training network." />
      <InstitutionForm mode="create" />
    </div>
  );
}
