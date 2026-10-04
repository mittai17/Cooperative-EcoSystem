import { notFound } from "next/navigation";
import { courses } from "@/lib/mock-data/courses";
import { CourseLearningView } from "./course-learning-view";

export default async function CourseLearningPage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  const course = courses.find((c) => c.id === id);
  if (!course) notFound();

  return <CourseLearningView course={course} />;
}
