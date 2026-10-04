"use client";

import { Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { CreateProgrammeForm } from "@/components/admin/programmes/create-programme-form";

export default function NewProgrammePage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Eye}
        title="Create Program"
        description="Add a new training program to the catalogue."
      />
      <div className="max-w-3xl">
        <CreateProgrammeForm />
      </div>
    </div>
  );
}
