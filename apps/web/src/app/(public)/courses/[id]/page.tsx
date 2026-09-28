import { notFound } from "next/navigation";
import { courses } from "@/lib/mock-data/courses";
import { buildCurriculum } from "./curriculum";
import { CourseLearningView } from "./course-learning-view";

export default async function CourseLearningPage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  const course = courses.find((c) => c.id === id);
  if (!course) notFound();

  const curriculum = buildCurriculum(course);

  return <CourseLearningView course={course} curriculum={curriculum} />;
}
