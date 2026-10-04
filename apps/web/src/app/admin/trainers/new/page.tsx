import { UserPlus } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AddTrainerForm } from "@/components/admin/trainers/trainer-form";

export default function AdminAddTrainerPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={UserPlus}
        title="Add Trainer"
        description="Register a new trainer and link them to an institution."
      />
      <AddTrainerForm />
    </div>
  );
}
