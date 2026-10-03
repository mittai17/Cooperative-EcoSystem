import { TraineeDetail } from "@/components/trainer/trainees/trainee-detail";

export default async function TrainerTraineeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TraineeDetail id={id} />;
}
