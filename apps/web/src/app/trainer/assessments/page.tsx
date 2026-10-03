"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterSelect } from "@/components/trainer/filter-select";
import { EmptyState, ErrorState } from "@/components/trainer/states";
import { AssessmentCard } from "@/components/trainer/assessments/assessment-card";
import type { AssessmentList, ClassOption } from "@/components/trainer/assessments/types";
import { Skeleton } from "@/components/ui/skeleton";
import { trainerPost, useTrainerQuery } from "@/lib/trainer/api";

type Tab = "upcoming" | "drafts" | "published" | "completed";
const TABS: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "drafts", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "completed", label: "Completed" },
];

export default function TrainerAssessmentsPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [batch, setBatch] = useState("");
  const [course, setCourse] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const qs = new URLSearchParams();
  if (batch) qs.set("batch_id", batch);
  if (course) qs.set("course_id", course);
  const { data, loading, error, refetch } = useTrainerQuery<AssessmentList>(`/assessments?${qs.toString()}`);
  const opts = useTrainerQuery<{ classes: ClassOption[] }>("/assessments/options");

  const classes = opts.data?.classes ?? [];
  const batches = Array.from(new Map(classes.map((c) => [c.batch_id, c.batch])).entries());
  const courses = Array.from(new Map(classes.filter((c) => !batch || c.batch_id === batch).map((c) => [c.course_id, c.course])).entries());

  const list = (data?.assessments ?? []).filter((a) => (tab === "published" ? a.status === "published" : a.group === tab));

  async function publish(id: string) {
    setBusyId(id);
    setActionError(null);
    try {
      await trainerPost(`/assessments/${id}/publish`);
      refetch();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assessments"
        description="Create, schedule and review assessments for the batches you teach."
        action={<Button render={<Link href="/trainer/assessments/new"><Plus className="mr-1.5 size-4" />Create Assessment</Link>} />}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
                {data && <span className="ml-1.5 text-xs text-muted-foreground">{data.counts[t.id]}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-3">
          <FilterSelect label="Batch" value={batch} onChange={(v) => { setBatch(v); setCourse(""); }}
            options={[{ value: "", label: "All batches" }, ...batches.map(([v, l]) => ({ value: v, label: l }))]} />
          <FilterSelect label="Course" value={course} onChange={setCourse}
            options={[{ value: "", label: "All courses" }, ...courses.map(([v, l]) => ({ value: v, label: l }))]} />
        </div>
      </div>
      {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : list.length === 0 ? (
        <EmptyState title={`No ${tab} assessments`} hint="Use Create Assessment to add one for a batch you teach." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => <AssessmentCard key={a.id} a={a} onPublish={publish} busy={busyId === a.id} />)}
        </div>
      )}
    </div>
  );
}
