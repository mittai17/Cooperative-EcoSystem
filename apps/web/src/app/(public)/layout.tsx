import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/layout/app-shell";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // The trainee sidebar's "Courses" and "Jobs" items link into this route
  // group (there is no separate trainee-scoped catalog). For a signed-in
  // user, keep them inside their app shell instead of dropping them into the
  // signed-out marketing chrome, which was making the sidebar disappear and
  // showing the public "Sign In" nav on top of an otherwise authenticated
  // session.
  const { userId } = await auth();

  if (userId) {
    return (
      <AppShell role="trainee" userName="Ravindra S. Patil" userSubtitle="ravindra.patil@coopsetu.ai">
        {children}
      </AppShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
