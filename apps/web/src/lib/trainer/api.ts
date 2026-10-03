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
  const res = await fetch(`${TRAINER_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) {
    let detail = res.statusText || `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      /* no JSON body */
    }
    throw new TrainerApiError(res.status, detail);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
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
