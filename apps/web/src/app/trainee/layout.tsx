import { AppShell } from "@/components/layout/app-shell";
import { MockChatbot } from "@/components/dashboard/mock-chatbot";

export default function TraineeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="trainee" userName="Arjun Kumar" userSubtitle="arjunkumar@example.com">
      {children}
      <MockChatbot />
    </AppShell>
  );
}
