import { redirect } from "next/navigation";

export default function TraineeSettingsPage() {
  redirect("/trainee/profile?tab=settings");
}
