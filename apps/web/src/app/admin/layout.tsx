import { AppShell } from "@/components/layout/app-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="admin" userName="NCCT Admin Office" userSubtitle="admin@ncct.gov.in">
      {children}
    </AppShell>
  );
}
