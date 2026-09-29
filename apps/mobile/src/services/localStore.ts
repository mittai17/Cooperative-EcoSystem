import { useSyncExternalStore } from 'react';
import { Course } from '../types';

/**
 * Small in-memory app state shared across screens (lesson completion, courses
 * saved for offline use, attendance scans waiting to sync).
 *
 * NOTE: memory only, and cleared on sign-out. The server is the source of truth
 * for progress and downloads; this store is a session cache plus the offline
 * attendance queue (persisting it across restarts needs a storage module).
 */

export interface PendingScan {
  id: string;
  token: string;
  queuedAt: string; // ISO
}

export interface StoreState {
  /** courseId -> moduleId -> completed (overrides the module's own flag) */
  completed: Record<string, Record<string, boolean>>;
  /** courses saved for offline use, keyed by course id */
  downloads: Record<string, { course: Course; savedAt: string }>;
  pendingScans: PendingScan[];
}

let state: StoreState = { completed: {}, downloads: {}, pendingScans: [] };
const listeners = new Set<() => void>();

const set = (next: Partial<StoreState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const useLocalStore = (): StoreState => useSyncExternalStore(subscribe, () => state);

export const localStore = {
  getState: () => state,

  /** Clears everything (called on logout). */
  reset() {
    set({ completed: {}, downloads: {}, pendingScans: [] });
  },

  isModuleDone(courseId: string, moduleId: string, fallback: boolean): boolean {
    return state.completed[courseId]?.[moduleId] ?? fallback;
  },

  setModuleDone(courseId: string, moduleId: string, done: boolean) {
    set({
      completed: {
        ...state.completed,
        [courseId]: { ...(state.completed[courseId] || {}), [moduleId]: done },
      },
    });
  },

  /** Replaces the downloaded set with what the server reports (courses carry their modules). */
  setDownloads(entries: { course: Course; savedAt: string }[]) {
    set({ downloads: Object.fromEntries(entries.map((e) => [e.course.id, e])) });
  },

  saveDownload(course: Course) {
    set({ downloads: { ...state.downloads, [course.id]: { course, savedAt: new Date().toISOString() } } });
  },

  removeDownload(courseId: string) {
    const { [courseId]: _removed, ...rest } = state.downloads;
    set({ downloads: rest });
  },

  enqueueScan(token: string) {
    set({
      pendingScans: [
        ...state.pendingScans,
        { id: `${Date.now()}-${state.pendingScans.length}`, token, queuedAt: new Date().toISOString() },
      ],
    });
  },

  dropScans(ids: string[]) {
    set({ pendingScans: state.pendingScans.filter((s) => !ids.includes(s.id)) });
  },
};

/** Lesson-based progress (0-100) when the course has lessons, else the server-reported value. */
export const courseProgress = (course: Course, completed: StoreState['completed']): number => {
  const modules = course.modules;
  if (modules && modules.length > 0) {
    const done = modules.filter((m) => completed[course.id]?.[m.id] ?? m.completed).length;
    return Math.round((done / modules.length) * 100);
  }
  return Math.round(course.progress ?? 0);
};
