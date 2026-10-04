"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TRAINER_BASE = `${API_BASE}/api/v1/trainer`;

export class TrainerApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Mock-auth prototype: no token. Optional `X-Demo-User` email selects another trainer. */
export async function trainerFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  // Mock data for frontend demo since backend is unavailable
  return new Promise((resolve) => {
    setTimeout(() => {
      const p = path.split("?")[0];
      
      if (p === "/dashboard") {
        resolve({
          trainer: { id: "1", name: "Dr. S. Kumar" },
          today: new Date().toISOString().split("T")[0],
          kpis: { todays_classes: 2, upcoming_classes: 5, trainees: 45, average_attendance: 92, attendance_delta: 2, pending_assessments: 3, at_risk: 1, pending_breakdown: { attempts_to_review: 2, submissions_to_grade: 1 } },
          today_classes: [
            { slot_id: "s1", course_id: "c1", course: "Cooperative Management Fundamentals", batch: "Batch A", batch_id: "b1", class_id: "cl1", date: new Date().toISOString().split("T")[0], start: "10:00", end: "11:00", start_label: "10:00 AM", end_label: "11:00 AM", room: "Room 101", trainees: 25, attendance_status: "pending", session_id: null, present: null }
          ],
          upcoming: { tomorrow: [], this_week: [] },
          at_risk_trainees: [
            { id: "tr1", name: "Anjali Rathore", batch: "Batch A", attendance: 65, learning: 50, last_activity: new Date().toISOString(), risk_reasons: ["Low Attendance"] }
          ],
          attendance_trend: [],
          learning_progress: [{ class_id: "cl1", course: "Cooperative Management Fundamentals", batch: "Batch A", progress: 45 }],
          upcoming_assessments: [],
          recent_activity: [],
          skills: [],
          insights: [{ severity: "positive", text: "Overall attendance has improved by 2% this week." }],
          unread_messages: 2
        } as unknown as T);
        return;
      }

      if (p === "/trainees") {
        resolve({ items: [], count: 0, average_attendance: 90, average_learning: 80, at_risk_count: 0 } as unknown as T);
        return;
      }
      
      if (p.startsWith("/trainees/")) {
        resolve({ trainee: { id: p.split("/").pop(), name: "Mock Trainee", attendance: 90, learning: 80, risk_reasons: [] }, enrollments: [], activity: [], skills: [] } as unknown as T);
        return;
      }

      if (p === "/classes") {
        resolve({ classes: [] } as unknown as T);
        return;
      }
      
      if (p.startsWith("/classes/")) {
         resolve({ 
            class_id: p.split("/").pop(), course: "Mock Course", batch: "Mock Batch", 
            instructor: "Dr. S. Kumar", schedule: "Mon/Wed", room: "101", 
            trainees_count: 0, attendance_avg: 100, learning_avg: 100, 
            syllabus: [], trainees: [], recent_slots: [] 
         } as unknown as T);
         return;
      }

      if (p === "/assessments/options" || p === "/assignments/options") {
        resolve({ classes: [] } as unknown as T);
        return;
      }

      if (p === "/assignments") {
        resolve({ assignments: [] } as unknown as T);
        return;
      }
      
      if (p.startsWith("/assignments/")) {
        resolve({ id: p.split("/").pop(), title: "Mock Assignment", type: "homework", due_at: new Date().toISOString(), total_points: 100, submissions: [] } as unknown as T);
        return;
      }
      
      if (p === "/content") {
        resolve({ library: [], folders: [] } as unknown as T);
        return;
      }
      
      if (p === "/attendance" || p.startsWith("/attendance?")) {
         resolve({ slots: [], summary: { total: 0, pending: 0, completed: 0 } } as unknown as T);
         return;
      }
      
      if (p.startsWith("/attendance/session/")) {
         resolve({ 
            session_id: p.split("/")[3], slot: { 
               slot_id: "s1", course_id: "c1", course: "Mock Course", batch: "Batch A", batch_id: "b1", 
               class_id: "cl1", date: new Date().toISOString().split("T")[0], start: "10:00", end: "11:00", 
               start_label: "10:00 AM", end_label: "11:00 AM", room: "Room 101", trainees: 25, 
               attendance_status: "pending", session_id: null, present: null 
            }, 
            roster: [] 
         } as unknown as T);
         return;
      }
      
      if (p === "/analytics" || p.startsWith("/analytics?")) {
         resolve({ kpis: {}, attendance_chart: [], performance_chart: [], top_performers: [], at_risk: [] } as unknown as T);
         return;
      }
      
      if (p === "/skills") {
         resolve({ summary: {}, distributions: [], top_skills: [], gap_areas: [] } as unknown as T);
         return;
      }
      
      if (p === "/skills/evaluation-dimensions") {
         resolve({ dimensions: [] } as unknown as T);
         return;
      }
      
      if (p === "/messages") {
         resolve({ conversations: [], unread_total: 0 } as unknown as T);
         return;
      }
      
      if (p === "/messages/recipients") {
         resolve({ recipients: [] } as unknown as T);
         return;
      }
      
      if (p === "/announcements") {
         resolve({ announcements: [] } as unknown as T);
         return;
      }
      
      if (p === "/reports/types") {
         resolve({ types: [] } as unknown as T);
         return;
      }

      // Default fallback
      resolve({} as unknown as T);
    }, 400);
  });
}

export const trainerPost = <T = unknown>(path: string, body?: unknown) =>
  trainerFetch<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
export const trainerPut = <T = unknown>(path: string, body?: unknown) =>
  trainerFetch<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) });

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** GET `path` (relative to /api/v1/trainer). Pass `null` to skip. Optional polling in ms. */
export function useTrainerQuery<T>(path: string | null, opts: { pollMs?: number } = {}): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (path === null) return;
    let cancelled = false;
    if (first.current || tick > 0) setLoading(data === null);
    trainerFetch<T>(path)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        first.current = false;
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick]);

  useEffect(() => {
    if (!opts.pollMs || path === null) return;
    const id = setInterval(() => setTick((t) => t + 1), opts.pollMs);
    return () => clearInterval(id);
  }, [opts.pollMs, path]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, refetch };
}
