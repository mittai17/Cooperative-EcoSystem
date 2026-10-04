import { AppShell } from "@/components/layout/app-shell";

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      role="employer"
      userName="Amul Dairy Cooperative Union"
      userSubtitle="hr@amul.nurvex.ai"
    >
      {children}
    </AppShell>
  );
}
