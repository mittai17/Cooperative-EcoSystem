import { AppShell } from "@/components/layout/app-shell";

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      role="institution"
      userName="Institute of Rural Management"
      userSubtitle="admin@irma.coopsetu.ai"
    >
      {children}
    </AppShell>
  );
}
