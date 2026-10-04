import { UserCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function InstitutionProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Institution Profile"
        description="Manage your institution's contact details and accreditation information."
      />
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <UserCircle className="size-8 text-muted-foreground" />
          <p className="font-medium text-foreground">This feature is not built yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Profile editing for institutions is not available in this version.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
