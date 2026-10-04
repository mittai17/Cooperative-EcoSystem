import { JobEditLoader } from "@/components/employer/jobs/job-edit-loader";

export default async function EmployerJobEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  return <JobEditLoader jobId={id} savedNotice={saved ?? null} />;
}
