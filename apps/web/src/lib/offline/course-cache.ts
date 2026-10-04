"use client";

import type { Course } from "@/lib/types";
import { buildCurriculum, flattenLessons } from "@/app/(public)/courses/[id]/curriculum";
import {
  saveCachedCourse,
  saveCachedLessonsBatch,
  getCachedCourse,
  removeCachedCourse,
  getAllCachedCourses,
  type CachedCourse,
  type CachedLesson,
} from "./db";

/**
 * Downloads and caches a course and all its derived modules and lessons
 * into IndexedDB for offline access.
 */
export async function downloadCourseForOffline(course: Course): Promise<void> {
  const curriculum = buildCurriculum(course, (k) => k);
  const flatLessons = flattenLessons(curriculum);

  // Generate lesson contents and quiz metadata for offline reading
  const cachedLessons: CachedLesson[] = flatLessons.map((l) => ({
    id: l.id,
    courseId: course.id,
    moduleId: l.id.split("-")[0] + "-" + l.id.split("-")[1],
    title: l.title,
    durationMinutes: l.durationMinutes,
    completed: l.completedByDefault,
    lastAccessedAt: new Date().toISOString(),
    content: `## ${l.title}

### Learning Objectives
1. Grasp foundational principles of ${course.category} in Indian primary cooperative societies.
2. Implement statutory bylaws, transparency registers, and internal audit guidelines.
3. Solve field scenarios encountered during society day-to-day operations.

### Practical Field Guide
In primary cooperative societies, records must be updated daily. Whether managing dairy procurement, agricultural credit appraisals, or handloom inventories, digital and physical reconciliations protect member equity.

### Key Key Takeaways
- Active governance prevents default risks and non-performing assets.
- Cooperative decision-making requires quorum compliance and transparent minute documentation.
- Digital tool adoption bridges rural members to national value chains.`,
    quizMetadata: {
      questionCount: 3,
      sampleQuestion: `What is the primary governing body responsible for decisions in this ${course.category} module?`,
      options: [
        "General Body of Members",
        "External Commercial Bank",
        "Local Municipality",
        "Individual Society Secretary",
      ],
    },
  }));

  const estimatedSizeBytes = JSON.stringify(cachedLessons).length + JSON.stringify(curriculum).length + 2048;

  const cachedCourse: CachedCourse = {
    id: course.id,
    title: course.title,
    category: course.category,
    level: course.level,
    durationHours: course.durationHours,
    instructor: course.instructor,
    rating: course.rating,
    enrolled: course.enrolled,
    description: course.description,
    skills: course.skills,
    modules: curriculum.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        durationMinutes: l.durationMinutes,
        completed: l.completedByDefault,
      })),
    })),
    progress: Math.round(
      (cachedLessons.filter((l) => l.completed).length / (cachedLessons.length || 1)) * 100
    ),
    savedAt: new Date().toISOString(),
    sizeBytes: estimatedSizeBytes,
  };

  await Promise.all([
    saveCachedCourse(cachedCourse),
    saveCachedLessonsBatch(cachedLessons),
  ]);

  // Request Service Worker to cache the course URL as well
  if (typeof window !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CACHE_URLS",
      urls: [`/courses/${course.id}`, `/courses`],
    });
  }
}

export async function isCourseOfflineReady(courseId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const course = await getCachedCourse(courseId);
    return Boolean(course);
  } catch {
    return false;
  }
}

export async function deleteCourseFromOffline(courseId: string): Promise<void> {
  await removeCachedCourse(courseId);
}

export async function getOfflineCourses(): Promise<CachedCourse[]> {
  return await getAllCachedCourses();
}
