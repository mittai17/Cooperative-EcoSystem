import { JobDetailView } from "@/components/employer/jobs/job-detail-view";

export default async function EmployerJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ published?: string }>;
}) {
  const { id } = await params;
  const { published } = await searchParams;
  return <JobDetailView jobId={id} published={published === "1"} />;
}
