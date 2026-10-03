"use client";

import { Briefcase } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { PostJobForm } from "@/components/admin/jobs/post-job-form";

export default function PostJobPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Briefcase}
        title="Post Job"
        description="Publish a job opening on behalf of an employer."
      />
      <div className="max-w-3xl">
        <PostJobForm />
      </div>
    </div>
  );
}
