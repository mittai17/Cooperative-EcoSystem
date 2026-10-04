import { Platform } from 'react-native';

export function resolveNativeApiBase(): string | null {
  const override = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (override) {
    return `${override.replace(/\/+$/, '').replace(/\/api\/v1$/, '')}/api/v1`;
  }
  return null;
}

export const API_BASE_URL = Platform.OS === 'web' ? '/api-proxy/api/v1' : resolveNativeApiBase() ?? '';
export const API_CONFIGURED = Platform.OS === 'web' || Boolean(API_BASE_URL);

const REQUEST_TIMEOUT_MS = 10000;

export type TokenGetter = (options?: { skipCache?: boolean }) => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function configureAuthClient(config: {
  getToken: TokenGetter | null;
  onUnauthorized: (() => void) | null;
}) {
  tokenGetter = config.getToken;
  unauthorizedHandler = config.onUnauthorized;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...init } = options;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = new Headers(customHeaders);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth && tokenGetter) {
    const token = await tokenGetter();
    if (!token) throw new ApiError(401, 'Sign in to continue.');
    headers.set('Authorization', `Bearer ${token}`);
  }

  const send = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const onAbort = () => controller.abort();
    init.signal?.addEventListener('abort', onAbort, { once: true });
    try {
      return await fetch(url, { ...init, headers, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
      init.signal?.removeEventListener('abort', onAbort);
    }
  };

  try {
    let res = await send();
    if (res.status === 401 && !skipAuth && tokenGetter) {
      const refreshed = await tokenGetter({ skipCache: true });
      if (refreshed) {
        headers.set('Authorization', `Bearer ${refreshed}`);
        res = await send();
      }
      if (res.status === 401) unauthorizedHandler?.();
    }

    if (!res.ok) {
      let errorMsg = `Request failed with status ${res.status}`;
      let errorDetails: unknown = null;
      try {
        const json = await res.json();
        errorDetails = json;
        if (json && typeof json === 'object') {
          errorMsg = (json as { detail?: string }).detail || (json as { message?: string }).message || errorMsg;
        }
      } catch {
        // Not JSON
      }
      throw new ApiError(res.status, errorMsg, errorDetails);
    }

    if (res.status === 204) {
      return undefined as unknown as T;
    }

    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Network request timed out. Please check your connection.');
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
  }
}
