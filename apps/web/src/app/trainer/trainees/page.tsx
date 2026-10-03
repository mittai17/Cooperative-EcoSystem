import { Suspense } from "react";
import { TraineesList } from "@/components/trainer/trainees/trainees-list";

export default function TrainerTraineesPage() {
  return (
    <Suspense fallback={null}>
      <TraineesList />
    </Suspense>
  );
}
