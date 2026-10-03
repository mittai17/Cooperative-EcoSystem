import { Suspense } from "react";
import { ClassDetail } from "@/components/trainer/classes/class-detail";

export default async function TrainerClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <ClassDetail id={id} />
    </Suspense>
  );
}
