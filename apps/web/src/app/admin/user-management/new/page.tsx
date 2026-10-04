import { UserPlus } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AddUserForm } from "@/components/admin/users/add-user-form";

export default function AdminAddUserPage() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={UserPlus}
        title="Add User"
        description="Create an admin account and assign its role."
      />
      <AddUserForm />
    </div>
  );
}
