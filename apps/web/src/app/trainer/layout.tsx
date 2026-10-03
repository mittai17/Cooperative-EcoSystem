import { AppShell } from "@/components/layout/app-shell";

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="trainer" userName="Dr. S. Kumar" userSubtitle="VAMNICOM Training Centre">
      {children}
    </AppShell>
  );
}
