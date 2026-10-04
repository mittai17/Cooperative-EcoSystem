// Browser-native IndexedDB wrapper for NURVEX Offline Engine

export interface CachedLessonSummary {
  id: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
}

export interface CachedModule {
  id: string;
  title: string;
  lessons: CachedLessonSummary[];
}

export interface CachedCourse {
  id: string;
  title: string;
  category: string;
  level: string;
  durationHours: number;
  instructor: string;
  rating: number;
  enrolled: number;
  description: string;
  skills: string[];
  modules: CachedModule[];
  progress: number;
  savedAt: string;
  sizeBytes: number;
}

export interface CachedLesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
  content: string;
  quizMetadata?: {
    questionCount: number;
    sampleQuestion: string;
    options: string[];
  };
  lastAccessedAt: string;
}

export type SyncActionType = 'MARK_LESSON_COMPLETE' | 'RECORD_ATTENDANCE' | 'SUBMIT_ASSESSMENT';

export interface SyncQueueItem {
  id: string;
  action: SyncActionType;
  payload: Record<string, unknown>;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  error?: string;
}

const DB_NAME = 'nurvex_offline_db';
const DB_VERSION = 1;

const STORES = {
  COURSES: 'cachedCourses',
  LESSONS: 'cachedLessons',
  SYNC_QUEUE: 'syncQueue',
  META: 'meta',
} as const;

let dbInstance: IDBDatabase | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      return reject(new Error('IndexedDB is not supported or running outside browser environment'));
    }

    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. cachedCourses store
      if (!db.objectStoreNames.contains(STORES.COURSES)) {
        const courseStore = db.createObjectStore(STORES.COURSES, { keyPath: 'id' });
        courseStore.createIndex('category', 'category', { unique: false });
        courseStore.createIndex('savedAt', 'savedAt', { unique: false });
      }

      // 2. cachedLessons store
      if (!db.objectStoreNames.contains(STORES.LESSONS)) {
        const lessonStore = db.createObjectStore(STORES.LESSONS, { keyPath: 'id' });
        lessonStore.createIndex('courseId', 'courseId', { unique: false });
        lessonStore.createIndex('completed', 'completed', { unique: false });
      }

      // 3. syncQueue store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('action', 'action', { unique: false });
      }

      // 4. meta store
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

// -------------------------------------------------------------
// Course Operations
// -------------------------------------------------------------

export async function saveCachedCourse(course: CachedCourse): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.COURSES], 'readwrite');
    const store = tx.objectStore(STORES.COURSES);
    const req = store.put(course);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedCourse(id: string): Promise<CachedCourse | undefined> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.COURSES], 'readonly');
    const store = tx.objectStore(STORES.COURSES);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllCachedCourses(): Promise<CachedCourse[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.COURSES], 'readonly');
    const store = tx.objectStore(STORES.COURSES);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeCachedCourse(id: string): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.COURSES, STORES.LESSONS], 'readwrite');
    const courseStore = tx.objectStore(STORES.COURSES);
    const lessonStore = tx.objectStore(STORES.LESSONS);

    courseStore.delete(id);

    // Also remove associated lessons
    const index = lessonStore.index('courseId');
    const cursorReq = index.openKeyCursor(IDBKeyRange.only(id));
    cursorReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result as IDBCursor;
      if (cursor) {
        lessonStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -------------------------------------------------------------
// Lesson Operations
// -------------------------------------------------------------

export async function saveCachedLesson(lesson: CachedLesson): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.LESSONS], 'readwrite');
    const store = tx.objectStore(STORES.LESSONS);
    const req = store.put(lesson);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveCachedLessonsBatch(lessons: CachedLesson[]): Promise<void> {
  if (lessons.length === 0) return;
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.LESSONS], 'readwrite');
    const store = tx.objectStore(STORES.LESSONS);

    for (const lesson of lessons) {
      store.put(lesson);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedLesson(id: string): Promise<CachedLesson | undefined> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.LESSONS], 'readonly');
    const store = tx.objectStore(STORES.LESSONS);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedLessonsByCourse(courseId: string): Promise<CachedLesson[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.LESSONS], 'readonly');
    const store = tx.objectStore(STORES.LESSONS);
    const index = store.index('courseId');
    const req = index.getAll(IDBKeyRange.only(courseId));

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function updateCachedLessonCompletion(
  courseId: string,
  lessonId: string,
  completed: boolean
): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.LESSONS, STORES.COURSES], 'readwrite');
    const lessonStore = tx.objectStore(STORES.LESSONS);
    const courseStore = tx.objectStore(STORES.COURSES);

    // 1. Update lesson record
    const getLessonReq = lessonStore.get(lessonId);
    getLessonReq.onsuccess = () => {
      if (getLessonReq.result) {
        const updated = { ...getLessonReq.result, completed };
        lessonStore.put(updated);
      }
    };

    // 2. Update course progress
    const getCourseReq = courseStore.get(courseId);
    getCourseReq.onsuccess = () => {
      if (getCourseReq.result) {
        const course = getCourseReq.result as CachedCourse;
        let total = 0;
        let completedCount = 0;

        course.modules = course.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => {
            total++;
            const isCompleted = l.id === lessonId ? completed : l.completed;
            if (isCompleted) completedCount++;
            return { ...l, completed: isCompleted };
          }),
        }));

        course.progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        courseStore.put(course);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -------------------------------------------------------------
// Sync Queue Operations
// -------------------------------------------------------------

export async function enqueueSyncItem(
  action: SyncActionType,
  payload: Record<string, unknown>
): Promise<SyncQueueItem> {
  const db = await openOfflineDB();
  const id = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const item: SyncQueueItem = {
    id,
    action,
    payload,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const req = store.put(item);

    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');
    const req = index.getAll(IDBKeyRange.only('pending'));

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllSyncItems(): Promise<SyncQueueItem[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function updateSyncItemStatus(
  id: string,
  status: SyncQueueItem['status'],
  error?: string
): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const req = store.get(id);

    req.onsuccess = () => {
      const item = req.result as SyncQueueItem;
      if (item) {
        item.status = status;
        if (error) item.error = error;
        if (status === 'failed') item.retryCount = (item.retryCount || 0) + 1;
        store.put(item);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function removeSyncItem(id: string): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearCompletedSyncItems(): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');
    const req = index.openCursor(IDBKeyRange.only('completed'));

    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result as IDBCursor;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingSyncCount(): Promise<number> {
  if (!isBrowser()) return 0;
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const index = store.index('status');
      const req = index.count(IDBKeyRange.only('pending'));

      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

// -------------------------------------------------------------
// Meta & Storage Stats
// -------------------------------------------------------------

export async function getLastSyncedTime(): Promise<string | null> {
  if (!isBrowser()) return null;
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORES.META], 'readonly');
      const store = tx.objectStore(STORES.META);
      const req = store.get('last_synced_at');

      req.onsuccess = () => resolve(req.result?.value || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setLastSyncedTime(time: string): Promise<void> {
  if (!isBrowser()) return;
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.META], 'readwrite');
    const store = tx.objectStore(STORES.META);
    const req = store.put({ key: 'last_synced_at', value: time });

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getStorageStats(): Promise<{
  coursesCount: number;
  lessonsCount: number;
  pendingCount: number;
  estimatedSizeBytes: number;
}> {
  if (!isBrowser()) {
    return { coursesCount: 0, lessonsCount: 0, pendingCount: 0, estimatedSizeBytes: 0 };
  }
  try {
    const [courses, pendingCount] = await Promise.all([
      getAllCachedCourses(),
      getPendingSyncCount(),
    ]);

    const lessonsCount = courses.reduce((acc, c) => {
      return acc + c.modules.reduce((mAcc, m) => mAcc + m.lessons.length, 0);
    }, 0);

    const estimatedSizeBytes = courses.reduce((acc, c) => acc + (c.sizeBytes || 0), 0);

    return {
      coursesCount: courses.length,
      lessonsCount,
      pendingCount,
      estimatedSizeBytes,
    };
  } catch {
    return { coursesCount: 0, lessonsCount: 0, pendingCount: 0, estimatedSizeBytes: 0 };
  }
}
