"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { LoadingBlock } from "@/components/trainer/states";
import { SessionView } from "@/components/trainer/attendance/session-view";

function Inner({ id }: { id: string }) {
  const mode = useSearchParams().get("mode") ?? "qr";
  return <SessionView id={id} mode={mode} />;
}

export default function AttendanceSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<LoadingBlock rows={6} />}>
      <Inner id={id} />
    </Suspense>
  );
}
