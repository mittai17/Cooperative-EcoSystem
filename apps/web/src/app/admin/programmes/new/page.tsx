"use client";

import { BookOpen } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { CreateProgrammeForm } from "@/components/admin/programmes/create-programme-form";

export default function NewProgrammePage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={BookOpen}
        title="Create Program"
        description="Add a new training program to the catalogue."
      />
      <div className="w-full max-w-3xl">
        <CreateProgrammeForm />
      </div>
    </div>
  );
}
