import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { API_BASE_URL } from './api';

export interface OutboxItem {
  id: string;
  action: string;
  payload: string;
  created_at: number;
  attempts: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed' | string;
}

export interface CachedCourseRow {
  id: string;
  data: string;
  updated_at: number;
}

export interface CachedUserRow {
  key: string;
  value: string;
  updated_at: number;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Initializes and returns the singleton CoopSetu SQLite database instance.
 * Creates the required tables: outbox, cached_courses, cached_user.
 */
export async function initOfflineDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('coopsetu.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS outbox (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'pending'
        );
        CREATE TABLE IF NOT EXISTS cached_courses (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cached_user (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      dbInstance = db;
      return db;
    })();
  }
  return initPromise;
}

/**
 * Adds an action to the offline outbox queue to be synced when online.
 * @param action Name of action (e.g. RECORD_ATTENDANCE, MARK_LESSON_COMPLETE, SUBMIT_NOMINATION)
 * @param payload Object or string with data to sync
 * @returns Generated ID of the queued action
 */
export async function queueOutboxAction(action: string, payload: unknown): Promise<string> {
  const db = await initOfflineDb();
  let id: string;
  try {
    id = Crypto.randomUUID();
  } catch {
    id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const now = Date.now();

  await db.runAsync(
    'INSERT INTO outbox (id, action, payload, created_at, attempts, status) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    action,
    payloadStr,
    now,
    0,
    'pending'
  );
  return id;
}

/**
 * Retrieves all pending outbox actions ordered by creation time.
 */
export async function getPendingOutboxActions(): Promise<OutboxItem[]> {
  const db = await initOfflineDb();
  const rows = await db.getAllAsync<OutboxItem>(
    "SELECT id, action, payload, created_at, attempts, status FROM outbox WHERE status = 'pending' ORDER BY created_at ASC"
  );
  return rows;
}

/**
 * Retrieves all outbox actions (pending, syncing, completed, failed).
 */
export async function getAllOutboxActions(): Promise<OutboxItem[]> {
  const db = await initOfflineDb();
  const rows = await db.getAllAsync<OutboxItem>(
    'SELECT id, action, payload, created_at, attempts, status FROM outbox ORDER BY created_at DESC'
  );
  return rows;
}

/**
 * Marks a queued outbox action as completed.
 * @param id Outbox action ID
 */
export async function markOutboxActionDone(id: string): Promise<void> {
  const db = await initOfflineDb();
  await db.runAsync("UPDATE outbox SET status = 'completed' WHERE id = ?", id);
}

/**
 * Updates attempts count and status for an outbox action.
 */
export async function updateOutboxActionStatus(
  id: string,
  status: string,
  incrementAttempts: boolean = true
): Promise<void> {
  const db = await initOfflineDb();
  if (incrementAttempts) {
    await db.runAsync('UPDATE outbox SET status = ?, attempts = attempts + 1 WHERE id = ?', status, id);
  } else {
    await db.runAsync('UPDATE outbox SET status = ? WHERE id = ?', status, id);
  }
}

/**
 * Deletes an action from the outbox.
 */
export async function deleteOutboxAction(id: string): Promise<void> {
  const db = await initOfflineDb();
  await db.runAsync('DELETE FROM outbox WHERE id = ?', id);
}

/**
 * Caches an entity into the specified SQLite table.
 * - cached_courses: id is the primary key
 * - cached_user: key is the primary key
 */
export async function cacheEntity(
  table: 'cached_courses' | 'cached_user',
  id: string,
  data: unknown
): Promise<void> {
  const db = await initOfflineDb();
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  const now = Date.now();

  if (table === 'cached_courses') {
    await db.runAsync(
      'INSERT OR REPLACE INTO cached_courses (id, data, updated_at) VALUES (?, ?, ?)',
      id,
      serialized,
      now
    );
  } else if (table === 'cached_user') {
    await db.runAsync(
      'INSERT OR REPLACE INTO cached_user (key, value, updated_at) VALUES (?, ?, ?)',
      id,
      serialized,
      now
    );
  }
}

/**
 * Retrieves a cached entity by ID from the specified SQLite table.
 */
export async function getCachedEntity<T = unknown>(
  table: 'cached_courses' | 'cached_user',
  id: string
): Promise<T | null> {
  const db = await initOfflineDb();
  if (table === 'cached_courses') {
    const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM cached_courses WHERE id = ?', id);
    if (!row) return null;
    try {
      return JSON.parse(row.data) as T;
    } catch {
      return row.data as unknown as T;
    }
  } else if (table === 'cached_user') {
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM cached_user WHERE key = ?', id);
    if (!row) return null;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as unknown as T;
    }
  }
  return null;
}

/**
 * Deletes a cached entity by ID.
 */
export async function deleteCachedEntity(
  table: 'cached_courses' | 'cached_user',
  id: string
): Promise<void> {
  const db = await initOfflineDb();
  if (table === 'cached_courses') {
    await db.runAsync('DELETE FROM cached_courses WHERE id = ?', id);
  } else if (table === 'cached_user') {
    await db.runAsync('DELETE FROM cached_user WHERE key = ?', id);
  }
}

/**
 * Retrieves all cached courses from SQLite.
 */
export async function getAllCachedCourses<T = unknown>(): Promise<{ id: string; data: T; updated_at: number }[]> {
  const db = await initOfflineDb();
  const rows = await db.getAllAsync<{ id: string; data: string; updated_at: number }>(
    'SELECT id, data, updated_at FROM cached_courses ORDER BY updated_at DESC'
  );
  return rows.map((r) => {
    let parsed: T;
    try {
      parsed = JSON.parse(r.data) as T;
    } catch {
      parsed = r.data as unknown as T;
    }
    return {
      id: r.id,
      data: parsed,
      updated_at: r.updated_at,
    };
  });
}

/**
 * Clears all cached courses and user records from SQLite.
 */
export async function clearAllCache(): Promise<void> {
  const db = await initOfflineDb();
  await db.execAsync(`
    DELETE FROM cached_courses;
    DELETE FROM cached_user;
  `);
}

/**
 * Clears completed outbox actions.
 */
export async function clearCompletedOutbox(): Promise<void> {
  const db = await initOfflineDb();
  await db.runAsync("DELETE FROM outbox WHERE status = 'completed'");
}

/**
 * Returns database storage statistics.
 */
export async function getDbStats(): Promise<{
  pendingOutbox: number;
  totalOutbox: number;
  cachedCoursesCount: number;
  cachedCoursesSizeKb: number;
}> {
  const db = await initOfflineDb();
  const pendingOutboxRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM outbox WHERE status = 'pending'"
  );
  const totalOutboxRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM outbox'
  );
  const coursesRow = await db.getFirstAsync<{ count: number; totalBytes: number | null }>(
    'SELECT COUNT(*) as count, SUM(LENGTH(data)) as totalBytes FROM cached_courses'
  );

  const totalBytes = coursesRow?.totalBytes ?? 0;
  return {
    pendingOutbox: pendingOutboxRow?.count ?? 0,
    totalOutbox: totalOutboxRow?.count ?? 0,
    cachedCoursesCount: coursesRow?.count ?? 0,
    cachedCoursesSizeKb: Math.round(totalBytes / 1024),
  };
}

/**
 * Attempts to sync all pending outbox actions with the backend.
 * Uses POST /offline_sync/batch if online.
 */
export async function syncPendingOutbox(authToken?: string): Promise<{
  total: number;
  succeeded: number;
  failed: number;
}> {
  const pending = await getPendingOutboxActions();
  if (pending.length === 0) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  // Format batch payload
  const items = pending.map((item) => {
    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(item.payload);
    } catch {
      parsedPayload = { raw: item.payload };
    }
    return {
      id: item.id,
      action: item.action,
      payload: parsedPayload,
      client_timestamp: new Date(item.created_at).toISOString(),
    };
  });

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(`${API_BASE_URL}/offline_sync/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ items }),
    });

    if (res.ok) {
      const data = await res.json();
      const results: { id: string; status: string }[] = data.results || [];
      let succeeded = 0;
      let failed = 0;

      for (const result of results) {
        if (result.status === 'success' || result.status === 'duplicate') {
          await markOutboxActionDone(result.id);
          succeeded++;
        } else {
          await updateOutboxActionStatus(result.id, 'failed', true);
          failed++;
        }
      }
      return { total: pending.length, succeeded, failed };
    } else {
      // Mark attempts
      for (const item of pending) {
        await updateOutboxActionStatus(item.id, 'pending', true);
      }
      return { total: pending.length, succeeded: 0, failed: pending.length };
    }
  } catch {
    // Network failure
    for (const item of pending) {
      await updateOutboxActionStatus(item.id, 'pending', true);
    }
    return { total: pending.length, succeeded: 0, failed: pending.length };
  }
}
