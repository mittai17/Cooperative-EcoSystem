import { GraduationCap } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { EnrollTraineeForm } from "@/components/admin/trainees/enroll-trainee-form";

export default function AdminEnrollTraineePage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={GraduationCap}
        title="Enroll Trainee"
        description="Enroll a new trainee into a program at an institution."
      />
      <EnrollTraineeForm />
    </div>
  );
}
