/**
 * Trainee-side view of the course catalogue.
 *
 * `lib/mock-data/courses.ts` holds the shared `Course` records; this module adds
 * the two things only the signed-in learner can see: enrolment progress and the
 * card artwork used by the catalogue grid. Both the catalogue page and the
 * offline hub read from here, so a course shows the same progress everywhere.
 */
import { courses } from "@/lib/mock-data/courses";
import type { Course } from "@/lib/types";

export interface TraineeCourse extends Course {
  /** 0-100 when the learner is enrolled, absent otherwise. */
  progress?: number;
  thumbnailGradient: string;
}

export interface Enrolment {
  courseId: string;
  progress: number;
}

/**
 * Enrolments for the demo learner. `progress: 100` rows back the "Completed"
 * filter on the offline hub, and `progress: 0` rows are courses that were
 * registered for but not yet started.
 */
export const traineeEnrolments: Enrolment[] = [
  { courseId: "course-coop-mgmt-101", progress: 100 },
  { courseId: "course-handloom-design-cataloguing", progress: 100 },
  { courseId: "course-leadership-coop-boards", progress: 84 },
  { courseId: "course-coop-bookkeeping", progress: 62 },
  { courseId: "course-data-analysis-coop", progress: 40 },
  { courseId: "course-dairy-ops-201", progress: 20 },
  { courseId: "course-fpo-export-readiness", progress: 0 },
];

const CARD_ARTWORK: Record<string, string> = {
  "course-coop-mgmt-101": "from-purple-500 to-indigo-400",
  "course-dairy-ops-201": "from-blue-500 to-cyan-400",
  "course-digital-marketing-101": "from-teal-500 to-emerald-400",
  "course-data-analysis-coop": "from-indigo-500 to-sky-400",
  "course-agri-credit-appraisal": "from-orange-500 to-amber-400",
  "course-handloom-design-cataloguing": "from-rose-500 to-pink-400",
  "course-coop-bookkeeping": "from-green-500 to-emerald-400",
  "course-leadership-coop-boards": "from-amber-500 to-yellow-400",
  "course-fpo-export-readiness": "from-lime-500 to-green-400",
};

const DEFAULT_ARTWORK = "from-slate-500 to-slate-400";

/** Progress lookup that returns undefined for courses the learner has not joined. */
export function getEnrolmentProgress(courseId: string): number | undefined {
  return traineeEnrolments.find((item) => item.courseId === courseId)?.progress;
}

export function isEnrolled(courseId: string): boolean {
  return getEnrolmentProgress(courseId) !== undefined;
}

/** Every catalogue course with the learner's progress and card artwork attached. */
export function getTraineeCourses(): TraineeCourse[] {
  return courses.map((course) => {
    const progress = getEnrolmentProgress(course.id);
    return {
      ...course,
      ...(progress === undefined ? {} : { progress }),
      thumbnailGradient: CARD_ARTWORK[course.id] ?? DEFAULT_ARTWORK,
    };
  });
}

/** Catalogue courses the learner can still enrol in, in catalogue order. */
export function getAvailableCourses(): TraineeCourse[] {
  return getTraineeCourses().filter((course) => !isEnrolled(course.id));
}

/** Unique categories present in the catalogue, sorted, with the "All" option first. */
export function getCatalogueCategories(): string[] {
  const unique = Array.from(new Set(courses.map((course) => course.category)));
  return ["All", ...unique.sort((a, b) => a.localeCompare(b))];
}

/** Unique levels present in the catalogue, sorted, with the "All" option first. */
export function getCatalogueLevels(): string[] {
  const unique = Array.from(new Set(courses.map((course) => course.level)));
  return ["All", ...unique.sort((a, b) => a.localeCompare(b))];
}