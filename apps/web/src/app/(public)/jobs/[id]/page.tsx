import { notFound } from "next/navigation";
import { jobs } from "@/lib/mock-data/jobs";
import { JobDetailsView } from "./job-details-view";

export default async function JobDetailsPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  return <JobDetailsView job={job} />;
}
