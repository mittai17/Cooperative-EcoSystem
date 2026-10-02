import { AppShell } from "@/components/layout/app-shell";

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      role="institution"
      userName="VAMNICOM, Pune"
      userSubtitle="Institution Admin"
    >
      {children}
    </AppShell>
  );
}
