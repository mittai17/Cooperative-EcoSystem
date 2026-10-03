"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AiAssistantPanel } from "@/components/trainer/ai-assistant";
import { ErrorState, LoadingBlock } from "@/components/trainer/states";
import { useTrainerQuery } from "@/lib/trainer/api";

type ClassRow = { id: string; course_id: string; course: string; batch: string; batch_id: string };

export default function AiAssistantPage() {
  const { data, loading, error, refetch } = useTrainerQuery<{ classes: ClassRow[] }>("/classes");
  const [classId, setClassId] = useState("");
  const selected = data?.classes.find((c) => c.id === classId);

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#E31B23]/10 text-[#E31B23]">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">AI Teaching Assistant</h1>
          <p className="text-sm text-muted-foreground">Draft quizzes, lesson plans and activities. Summaries use only your stored class metrics.</p>
        </div>
      </div>

      {loading && <LoadingBlock rows={2} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {data && (
        <>
          <label className="block space-y-1 text-xs text-muted-foreground">
            Course / batch
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="block h-9 w-full max-w-md rounded-lg border border-input bg-background px-2 text-sm text-foreground"
            >
              <option value="">All my classes</option>
              {data.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course} — {c.batch}
                </option>
              ))}
            </select>
          </label>
          <AiAssistantPanel key={classId} course={selected?.course} courseId={selected?.course_id} batchId={selected?.batch_id} />
        </>
      )}
    </div>
  );
}
