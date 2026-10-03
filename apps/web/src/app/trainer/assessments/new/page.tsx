"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AssessmentForm } from "@/components/trainer/assessments/assessment-form";
import { LoadingBlock } from "@/components/trainer/states";

function Inner() {
  const draft = useSearchParams().get("draft") ?? undefined;
  return <AssessmentForm key={draft ?? "new"} draftId={draft} />;
}

export default function NewAssessmentPage() {
  return (
    <Suspense fallback={<LoadingBlock rows={5} />}>
      <Inner />
    </Suspense>
  );
}
