"use client";

import { ClipboardCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { CreateAssessmentForm } from "@/components/admin/assessments/create-assessment-form";

export default function NewAssessmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={ClipboardCheck}
        title="Create Assessment"
        description="Schedule an assessment for a training program."
      />
      <div className="max-w-3xl">
        <CreateAssessmentForm />
      </div>
    </div>
  );
}
