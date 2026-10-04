import { AppShell } from "@/components/layout/app-shell";
import { trainerProfile } from "@/lib/mock-data/trainer";

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="trainer" userName={trainerProfile.name} userSubtitle="NCCT Certified Trainer">
      {children}
    </AppShell>
  );
}
