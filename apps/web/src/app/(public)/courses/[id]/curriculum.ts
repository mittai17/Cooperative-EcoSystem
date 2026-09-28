import type { Course } from "@/lib/types";

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  /** Seeded default completion state, purely for a realistic-looking demo. */
  completedByDefault: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

const moduleTemplates = [
  { title: "Introduction", verbs: ["What is", "History and Principles of", "Why it matters:"] },
  { title: "Core Concepts", verbs: ["Understanding", "Key Frameworks in", "Applying"] },
  { title: "Practical Application", verbs: ["Hands-on Practice:", "Case Study:", "Field Exercise:"] },
  { title: "Assessment & Review", verbs: ["Reviewing", "Common Pitfalls in", "Wrapping Up"] },
];

/**
 * Deterministically derives a plausible module/lesson curriculum from a
 * Course's existing skills and duration, so the new course-learning route
 * has content to render without adding fields to the shared Course type or
 * mock-data file.
 */
export function buildCurriculum(course: Course): Module[] {
  const topics = course.skills.length > 0 ? course.skills : [course.category];
  const totalMinutes = course.durationHours * 60;
  const moduleCount = Math.min(moduleTemplates.length, Math.max(2, Math.ceil(course.durationHours / 8)));
  const lessonsPerModule = Math.max(2, Math.round(6 / moduleCount) + 1);
  const totalLessons = moduleCount * lessonsPerModule;
  const perLesson = Math.max(8, Math.round(totalMinutes / totalLessons / 5) * 5);

  let lessonCounter = 0;
  const modules: Module[] = [];

  for (let m = 0; m < moduleCount; m++) {
    const template = moduleTemplates[m];
    const lessons: Lesson[] = [];
    for (let l = 0; l < lessonsPerModule; l++) {
      const topic = topics[lessonCounter % topics.length];
      const verb = template.verbs[l % template.verbs.length];
      lessons.push({
        id: `${course.id}-m${m}-l${l}`,
        title: `${verb} ${topic}`,
        durationMinutes: perLesson,
        // Seed the first module (and first lesson of the second) as already
        // watched, so the progress bar starts partway through like a
        // returning learner.
        completedByDefault: m === 0 || (m === 1 && l === 0),
      });
      lessonCounter++;
    }
    modules.push({ id: `${course.id}-m${m}`, title: template.title, lessons });
  }

  return modules;
}

export function flattenLessons(modules: Module[]): Lesson[] {
  return modules.flatMap((m) => m.lessons);
}
