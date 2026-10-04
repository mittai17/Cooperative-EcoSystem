/**
 * Typed client for the DIKSHA video search (free Government of India learning content).
 *
 * Endpoint: GET /api/v1/content/diksha/search
 *   q       2-100 chars (required)
 *   subject optional, one of DIKSHA_SUBJECTS
 *   limit   1-24, default 12
 *   offset  0-500
 *
 * The live proxy is used when it answers. When it cannot (no backend session,
 * upstream outage) the search is answered from `diksha-catalogue`, so the Learn
 * hub always returns playable content instead of an error state.
 */
import { getApiBase, resolveAuthToken } from "@/lib/api";
import { searchCatalogue } from "@/lib/content/diksha-catalogue";

const SEARCH_PATH = "/api/v1/content/diksha/search";

export const DIKSHA_SUBJECTS = [
  "Science",
  "Mathematics",
  "English",
  "Hindi",
  "Social Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Economics",
  "Accountancy",
] as const;

export type DikshaSubject = (typeof DIKSHA_SUBJECTS)[number];

export const DIKSHA_QUERY_MIN = 2;
export const DIKSHA_QUERY_MAX = 100;
export const DIKSHA_LIMIT_MAX = 24;
export const DIKSHA_DEFAULT_LIMIT = 12;
export const DIKSHA_OFFSET_MAX = 500;

export interface DikshaVideo {
  identifier: string;
  title: string;
  subject: string | null;
  language: string | null;
  license: string | null;
  copyright: string | null;
  size_mb: number | null;
  video_url: string;
}

export interface DikshaSearchResponse {
  items: DikshaVideo[];
  limit: number;
  offset: number;
}

export interface DikshaSearchParams {
  q: string;
  subject?: DikshaSubject;
  limit?: number;
  offset?: number;
}

/** Error raised for non-2xx responses or network failures. `message` is safe to show to users. */
export class DikshaApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = "DikshaApiError";
    this.status = status;
  }
}

/** Throws a RangeError-style Error for inputs the backend would reject with 422. */
function validateParams(params: DikshaSearchParams): void {
  const q = params.q.trim();
  if (q.length < DIKSHA_QUERY_MIN || q.length > DIKSHA_QUERY_MAX) {
    throw new Error(`Search must be ${DIKSHA_QUERY_MIN}-${DIKSHA_QUERY_MAX} characters.`);
  }
  if (params.subject !== undefined && !(DIKSHA_SUBJECTS as readonly string[]).includes(params.subject)) {
    throw new Error("Unknown subject.");
  }
  const limit = params.limit ?? DIKSHA_DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > DIKSHA_LIMIT_MAX) {
    throw new Error(`Limit must be between 1 and ${DIKSHA_LIMIT_MAX}.`);
  }
  const offset = params.offset ?? 0;
  if (!Number.isInteger(offset) || offset < 0 || offset > DIKSHA_OFFSET_MAX) {
    throw new Error(`Offset must be between 0 and ${DIKSHA_OFFSET_MAX}.`);
  }
}

function messageForStatus(status: number): string {
  if (status === 401 || status === 403) {
    return "Your session has expired or you do not have access to Learn. Sign in again.";
  }
  if (status === 422) {
    return "That search could not be processed. Check the text and subject, then try again.";
  }
  if (status === 502 || status === 503 || status === 504) {
    return "DIKSHA is unavailable right now. Please try again in a few minutes.";
  }
  return `Could not load videos (server responded ${status}).`;
}

/** Reads a human-readable message from an error body (`{ message }` or FastAPI `{ detail }`). */
async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) return null;
    const { message, detail } = body as { message?: unknown; detail?: unknown };
    if (typeof message === "string" && message.trim()) return message.trim();
    if (typeof detail === "string" && detail.trim()) return detail.trim();
    return null;
  } catch {
    return null;
  }
}

function isDikshaSearchResponse(value: unknown): value is DikshaSearchResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<DikshaSearchResponse>;
  return Array.isArray(v.items) && typeof v.limit === "number" && typeof v.offset === "number";
}

/** Catalogue fallback so a failed proxy never leaves the Learn hub empty. */
function searchCatalogueFallback(params: DikshaSearchParams): DikshaSearchResponse {
  const limit = params.limit ?? DIKSHA_DEFAULT_LIMIT;
  const offset = params.offset ?? 0;
  const items = searchCatalogue(params.q.trim(), params.subject, limit, offset);
  return { items, limit, offset };
}

export async function searchDikshaVideos(params: DikshaSearchParams): Promise<DikshaSearchResponse> {
  validateParams(params);

  const limit = params.limit ?? DIKSHA_DEFAULT_LIMIT;
  const offset = params.offset ?? 0;

  const search = new URLSearchParams({
    q: params.q.trim(),
    limit: String(limit),
    offset: String(offset),
  });
  if (params.subject) search.set("subject", params.subject);

  let response: Response;
  try {
    response = await fetch(`${getApiBase()}${SEARCH_PATH}?${search.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolveAuthToken()}`,
      },
    });
  } catch {
    return searchCatalogueFallback(params);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403 || response.status >= 500) {
      return searchCatalogueFallback(params);
    }
    const serverMessage = await readErrorMessage(response);
    throw new DikshaApiError(serverMessage ?? messageForStatus(response.status), response.status);
  }

  const data: unknown = await response.json();
  if (!isDikshaSearchResponse(data)) {
    return searchCatalogueFallback(params);
  }
  return data;
}

/**
 * DIKSHA content page for a video, or null when the identifier is not a plain DIKSHA content id.
 * Only the diksha.gov.in host is ever produced here, so the link cannot point elsewhere.
 */
export function dikshaPageUrl(identifier: string): string | null {
  if (!/^do_[A-Za-z0-9]+$/.test(identifier)) return null;
  return `https://diksha.gov.in/play/content/${identifier}`;
}

/** The video URL only when it is an absolute https URL; otherwise null (never used as a media src). */
export function safeVideoUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
