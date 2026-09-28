"use client";

import { useEffect, useState, useCallback } from "react";
import {
  enqueueSyncItem,
  getPendingSyncItems,
  updateSyncItemStatus,
  clearCompletedSyncItems,
  getPendingSyncCount,
  getLastSyncedTime,
  setLastSyncedTime,
  updateCachedLessonCompletion,
  type SyncActionType,
  type SyncQueueItem,
} from "./db";

const SYNC_EVENT_NAME = "coopsetu:offline-sync-event";

export interface SyncBatchResponseItem {
  id: string;
  action: SyncActionType;
  status: "success" | "duplicate" | "error";
  message?: string;
}

export interface SyncBatchResponse {
  processed_count: number;
  results: SyncBatchResponseItem[];
  synced_at: string;
}

function getApiUrl(): string {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:8000";
}

export function notifySyncStateChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
  }
}

let isSyncInProgress = false;

/**
 * Process all pending sync queue items by posting them in a batch to the backend.
 */
export async function processSyncQueue(): Promise<{ processed: number; failed: number }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { processed: 0, failed: 0 };
  }

  if (isSyncInProgress) {
    return { processed: 0, failed: 0 };
  }

  isSyncInProgress = true;
  notifySyncStateChange();

  try {
    const pendingItems = await getPendingSyncItems();
    if (pendingItems.length === 0) {
      isSyncInProgress = false;
      notifySyncStateChange();
      return { processed: 0, failed: 0 };
    }

    // Mark as syncing in local DB
    for (const item of pendingItems) {
      await updateSyncItemStatus(item.id, "syncing");
    }

    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/v1/offline-sync/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: pendingItems.map((item) => ({
          id: item.id,
          action: item.action,
          payload: item.payload,
          client_timestamp: item.timestamp,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync request failed with status ${response.status}`);
    }

    const data: SyncBatchResponse = await response.json();
    let processed = 0;
    let failed = 0;

    for (const res of data.results) {
      if (res.status === "success" || res.status === "duplicate") {
        await updateSyncItemStatus(res.id, "completed");
        processed++;
      } else {
        await updateSyncItemStatus(res.id, "failed", res.message || "Sync failed on server");
        failed++;
      }
    }

    // Clean up completed items
    await clearCompletedSyncItems();

    const now = new Date().toISOString();
    await setLastSyncedTime(now);

    return { processed, failed };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[SyncManager] Sync failed:", message);
    const pendingItems = await getPendingSyncItems();
    for (const item of pendingItems) {
      if (item.status === "syncing") {
        await updateSyncItemStatus(item.id, "failed", message);
      }
    }
    return { processed: 0, failed: pendingItems.length };
  } finally {
    isSyncInProgress = false;
    notifySyncStateChange();
  }
}

/**
 * Enqueue a lesson completion action. If offline, writes to IndexedDB cache immediately
 * and queues the action. If online, still queues & triggers sync immediately.
 */
export async function enqueueLessonComplete(
  courseId: string,
  lessonId: string
): Promise<SyncQueueItem> {
  // Update local IndexedDB cache right away for instant feedback
  await updateCachedLessonCompletion(courseId, lessonId, true);

  const item = await enqueueSyncItem("MARK_LESSON_COMPLETE", {
    course_id: courseId,
    lesson_id: lessonId,
    completed_at: new Date().toISOString(),
  });

  notifySyncStateChange();

  // If online, kick off sync in background
  if (typeof navigator !== "undefined" && navigator.onLine) {
    processSyncQueue().catch((err) => console.error("Auto-sync error:", err));
  }

  return item;
}

/**
 * Enqueue an attendance record action when scanning offline.
 */
export async function enqueueAttendanceRecord(
  qrToken: string,
  sessionId?: string,
  traineeId?: string
): Promise<SyncQueueItem> {
  const item = await enqueueSyncItem("RECORD_ATTENDANCE", {
    qr_token: qrToken,
    session_id: sessionId || "offline_session",
    trainee_id: traineeId || "trainee_offline",
    scanned_at: new Date().toISOString(),
  });

  notifySyncStateChange();

  if (typeof navigator !== "undefined" && navigator.onLine) {
    processSyncQueue().catch((err) => console.error("Auto-sync error:", err));
  }

  return item;
}

/**
 * Enqueue assessment submission when taking assessment offline.
 */
export async function enqueueAssessmentSubmission(
  assessmentId: string,
  score: number,
  answers?: Record<string, unknown>
): Promise<SyncQueueItem> {
  const item = await enqueueSyncItem("SUBMIT_ASSESSMENT", {
    assessment_id: assessmentId,
    score,
    answers: answers || {},
    submitted_at: new Date().toISOString(),
  });

  notifySyncStateChange();

  if (typeof navigator !== "undefined" && navigator.onLine) {
    processSyncQueue().catch((err) => console.error("Auto-sync error:", err));
  }

  return item;
}

/**
 * React hook to observe offline status, pending sync count, and last sync timestamp.
 */
export function useOfflineSync() {
  // Deterministic SSR/client-match initial value: `window` is a reliable
  // browser-only global. `navigator` is NOT reliable here - modern Node.js
  // ships a partial global `navigator` stub (no `.onLine`) during SSR, so
  // checking `typeof navigator` alone would read `navigator.onLine` as
  // `undefined` on the server while the real browser value differs on the
  // client, producing a hydration mismatch for anything that conditionally
  // renders based on `isOnline`. The real value is reconciled immediately
  // after mount below (and every 15s thereafter as a safety net).
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof window !== "undefined" && typeof navigator !== "undefined"
      ? navigator.onLine
      : true;
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshStatus = useCallback(async () => {
    if (typeof window === "undefined") return;
    const count = await getPendingSyncCount();
    const lastTime = await getLastSyncedTime();
    setPendingCount(count);
    setLastSyncedAt(lastTime);
    setIsSyncing(isSyncInProgress);
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return;
    await processSyncQueue();
    await refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      processSyncQueue().then(refreshStatus);
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshStatus();
    };

    const handleSyncEvent = () => {
      refreshStatus();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(SYNC_EVENT_NAME, handleSyncEvent);

    // Defer the initial status load to a microtask so it does not fire
    // synchronously inside the effect body (avoids set-state-in-effect lint rule).
    // Also reconcile isOnline against the real navigator.onLine value right away
    // (rather than waiting for the first 15s interval tick) so a page loaded
    // while genuinely offline reflects that immediately post-mount.
    const initialLoad = setTimeout(() => {
      void refreshStatus();
      setIsOnline((prev) => (prev !== navigator.onLine ? navigator.onLine : prev));
    }, 0);

    // Check periodically if online and pending items exist. Also reconcile isOnline
    // against the live navigator.onLine value: the browser's online/offline events
    // can be missed or misfire (e.g. under automation/devtools network emulation),
    // which would otherwise leave the UI stuck showing a stale connection state.
    const interval = setInterval(() => {
      void refreshStatus();
      setIsOnline((prev) => (prev !== navigator.onLine ? navigator.onLine : prev));
      if (navigator.onLine && pendingCount > 0 && !isSyncInProgress) {
        processSyncQueue().then(() => void refreshStatus());
      }
    }, 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(SYNC_EVENT_NAME, handleSyncEvent);
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [refreshStatus, pendingCount]);

  return {
    isOnline,
    pendingCount,
    lastSyncedAt,
    isSyncing,
    syncNow,
    refreshStatus,
  };
}
