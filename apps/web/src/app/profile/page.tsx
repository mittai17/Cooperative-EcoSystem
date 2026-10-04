import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get("nurvex_demo_role")?.value;

  const roleMap: Record<string, string> = {
    trainee: "/trainee/profile",
    employer: "/employer/profile",
    trainer: "/trainer/profile",
    institution: "/institution/profile",
    admin: "/admin/profile",
  };

  const target = (demoRole && roleMap[demoRole]) ? roleMap[demoRole] : "/trainee/profile";
  redirect(target);
}
