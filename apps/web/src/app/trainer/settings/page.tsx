import { redirect } from "next/navigation";

export default function TrainerSettingsPage() {
  redirect("/trainer/profile?tab=settings");
}
