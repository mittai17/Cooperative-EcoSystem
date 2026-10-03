"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfflineSync } from "@/lib/offline/sync-manager";

/* -------------------------------------------------------------------------- */
/*  Offline Sync Status Bar                                                   */
/* -------------------------------------------------------------------------- */

function OfflineSyncBar() {
  const { isOnline, pendingCount, isSyncing, lastSyncedAt, syncNow } = useOfflineSync();
  const [visible, setVisible] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  // Show bar when offline OR when there are pending items
  useEffect(() => {
    setVisible(!isOnline || pendingCount > 0 || isSyncing);
  }, [isOnline, pendingCount, isSyncing]);

  // Flash "synced" briefly
  useEffect(() => {
    if (isOnline && pendingCount === 0 && !isSyncing && lastSyncedAt) {
      setJustSynced(true);
      setVisible(true);
      const t = setTimeout(() => {
        setJustSynced(false);
        setVisible(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, pendingCount, isSyncing, lastSyncedAt]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border px-4 py-2 shadow-lg text-sm font-medium transition-all duration-300",
        !isOnline
          ? "border-amber-400/40 bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700/40"
          : justSynced
          ? "border-emerald-400/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700/40"
          : "border-blue-400/40 bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700/40"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="size-4 shrink-0" />
          <span>
            Offline mode
            {pendingCount > 0 && (
              <> &mdash; <strong>{pendingCount}</strong> record{pendingCount !== 1 ? "s" : ""} queued</>
            )}
          </span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="size-4 shrink-0 animate-spin" />
          <span>Syncing {pendingCount} record{pendingCount !== 1 ? "s" : ""}…</span>
        </>
      ) : justSynced ? (
        <>
          <CheckCircle2 className="size-4 shrink-0" />
          <span>All records synced</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <CloudUpload className="size-4 shrink-0" />
          <span>
            <strong>{pendingCount}</strong> record{pendingCount !== 1 ? "s" : ""} pending sync
          </span>
          <button
            onClick={() => void syncNow()}
            className="ml-1 rounded-full bg-blue-200 dark:bg-blue-800 px-2 py-0.5 text-xs hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors"
          >
            Sync now
          </button>
        </>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PWA Provider                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Registers the service worker for installability and static-asset caching.
 * Also renders the global offline sync status bar so users always know
 * when records are queued locally (attendance, assessments).
 */
export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.onupdatefound = () => {
            const worker = reg.installing;
            if (worker) {
              worker.onstatechange = () => {
                if (worker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[PWA] New content available — refresh to update.");
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }
  }, []);

  return (
    <>
      {children}
      <OfflineSyncBar />
    </>
  );
}
