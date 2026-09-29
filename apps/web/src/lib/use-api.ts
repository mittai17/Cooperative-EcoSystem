"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function parseError(response: Response): Promise<never> {
  let detail = response.statusText || `HTTP ${response.status}`;
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") detail = body.detail;
  } catch {
    // response had no JSON body; keep the statusText fallback
  }
  throw new ApiError(response.status, detail);
}

/**
 * Client-component hook for calling the FastAPI backend with the current
 * user's Clerk session token attached. Mirrors `lib/api.ts`'s
 * `fetchWithAuth` (server-only, via `auth()` from `@clerk/nextjs/server`),
 * which cannot be used from "use client" components.
 */
export function useApi() {
  const { getToken } = useAuth();

  const request = useCallback(
    async <T = unknown>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
      if (!response.ok) await parseError(response);
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    },
    [getToken],
  );

  const get = useCallback(<T = unknown>(path: string) => request<T>(path), [request]);
  const post = useCallback(
    <T = unknown>(path: string, body?: unknown) =>
      request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
    [request],
  );
  const patch = useCallback(
    <T = unknown>(path: string, body?: unknown) =>
      request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
    [request],
  );
  const put = useCallback(
    <T = unknown>(path: string, body?: unknown) =>
      request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
    [request],
  );

  return { request, get, post, patch, put };
}
