import { AppShell } from "@/components/layout/app-shell";

export default function TraineeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="trainee" userName="Ravindra S. Patil" userSubtitle="ravindra.patil@coopsetu.ai">
      {children}
    </AppShell>
  );
}
