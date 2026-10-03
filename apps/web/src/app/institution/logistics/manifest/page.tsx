"use client";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
export default function ManifestPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Passenger Manifest" description="Full boarding manifest across all trips — Phase 2." />
      <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="icon-tile-blue size-10"><Users className="size-5" /></span>
        <p className="text-sm font-medium text-foreground">Coming in Phase 2</p>
        <p className="text-xs text-muted-foreground max-w-xs">Passenger manifest with boarding status, group-by-stop view and authorised CSV export will be available in Phase 2.</p>
      </CardContent></Card>
    </div>
  );
}
