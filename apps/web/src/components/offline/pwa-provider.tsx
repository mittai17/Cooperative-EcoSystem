"use client";

import React, { useEffect } from "react";

/**
 * Registers the service worker for installability and static-asset caching
 * (real PWA benefits) without making any app-wide "you are offline" claim.
 *
 * A browser tab cannot reliably deliver a full offline app experience the
 * way the native mobile app (Expo, apps/mobile) can, so this provider does
 * NOT render a global offline banner. Offline messaging on the web is scoped
 * to where it is actually true:
 *  - Downloaded courses/lessons: see the "Downloaded for offline" section on
 *    /my-learning (src/lib/offline/course-cache.ts backs the IndexedDB cache).
 *  - Attendance/assessment queueing: a deliberate "record now, sync later"
 *    feature with its own localized indicators (see
 *    src/app/(trainee)/attendance/page.tsx, src/app/kiosk/attendance/page.tsx).
 */
export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[PWA] New content is available; please refresh.");
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

  return <>{children}</>;
}
