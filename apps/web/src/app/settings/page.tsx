import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("coopsetu_demo_role")?.value;

  const roleMap: Record<string, string> = {
    trainee: "/trainee/profile?tab=settings",
    employer: "/employer/settings",
    trainer: "/trainer/profile?tab=settings",
    institution: "/institution/settings",
    admin: "/admin/settings",
  };

  const target = (demoRole && roleMap[demoRole]) ? roleMap[demoRole] : "/trainee/profile?tab=settings";
  redirect(target);
}
