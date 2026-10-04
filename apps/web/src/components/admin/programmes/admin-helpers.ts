import {
  ADMIN_PAGE_SIZE_MAX,
  getSkillPassport,
  listAssessments,
  listJobs,
  listProgrammes,
  type Assessment,
  type Job,
  type Paged,
  type Programme,
  type SkillPassportRow,
} from "@/lib/admin/admin-api";

const MAX_PAGES = 10;

/** Reads every page of a backend list, bounded so a very large table cannot stall the screen. */
export async function listAll<T>(fetchPage: (page: number, pageSize: number) => Promise<Paged<T>>): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await fetchPage(page, ADMIN_PAGE_SIZE_MAX);
    rows.push(...res.items);
    if (rows.length >= res.total || res.items.length === 0) break;
  }
  return rows;
}

export const fetchAllProgrammes = (): Promise<Programme[]> =>
  listAll((page, page_size) => listProgrammes({ page, page_size }));

export const fetchAllJobs = (): Promise<Job[]> => listAll((page, page_size) => listJobs({ page, page_size }));

export const fetchAllAssessments = (): Promise<Assessment[]> =>
  listAll((page, page_size) => listAssessments({ page, page_size }));

export const fetchAllSkillPassport = (): Promise<SkillPassportRow[]> =>
  listAll((page, page_size) => getSkillPassport({ page, page_size }));

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}
