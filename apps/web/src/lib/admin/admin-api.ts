import { fetchWithAuth } from "@/lib/api";

/**
 * Typed client for the NCCT admin portal. Paths and shapes mirror
 * backend/app/api/v1/admin_portal.py under /api/v1/admin.
 *
 * - Every list helper clamps page_size to ADMIN_PAGE_SIZE_MAX (the backend rejects more).
 * - Request bodies are sent exactly as the backend expects. The backend forbids unknown fields.
 * - Callers own loading and error UI. Helpers reject on any non-2xx response.
 */

export const ADMIN_PAGE_SIZE_MAX = 100;

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

type PageQuery = { page?: number; page_size?: number };

function withQuery(path: string, query?: object): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query) as [string, string | number | boolean | null | undefined][]) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function clampPageSize<Q extends PageQuery>(query: Q): Q {
  if (query.page_size === undefined) return query;
  return { ...query, page_size: Math.min(Math.max(1, query.page_size), ADMIN_PAGE_SIZE_MAX) };
}

function listPaged<T, Q extends PageQuery>(path: string, query: Q = {} as Q): Promise<Paged<T>> {
  return fetchWithAuth(withQuery(path, clampPageSize(query))) as Promise<Paged<T>>;
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return fetchWithAuth(path, { method: "POST", body: JSON.stringify(body) }) as Promise<T>;
}

function patchJson<T>(path: string, body: unknown): Promise<T> {
  return fetchWithAuth(path, { method: "PATCH", body: JSON.stringify(body) }) as Promise<T>;
}

const enc = encodeURIComponent;

// ---------- Dashboard ----------

export interface DashboardKpis {
  institutions: number;
  trainers: number;
  trainees: number;
  certified: number;
  employers: number;
  deltas: {
    institutions?: number | null;
    trainers?: number | null;
    trainees?: number | null;
    certified?: number | null;
    employers?: number | null;
  };
}

export interface EnrollmentTrendPoint {
  month: string;
  new_enrollments: number;
  certifications: number;
}

export interface InstitutionsByState {
  state: string;
  count: number;
}

export interface ProgramDistributionPoint {
  label: string;
  percent: number;
}

export interface PlacementOverviewPoint {
  month: string;
  placements: number;
  rate: number;
}

export interface TopInstitution {
  id: string;
  name: string;
  state: string | null;
  trainees: number;
  trainers: number;
  rating: number | null;
}

export interface RecentActivity {
  kind: string;
  title: string;
  subtitle: string | null;
  at: string;
}

export interface RecentPlacement {
  candidate_name: string;
  role: string;
  employer: string;
  date: string;
}

export interface AiInsight {
  title: string;
  text: string;
}

export interface AdminDashboard {
  kpis: DashboardKpis;
  enrollment_trend: EnrollmentTrendPoint[];
  institutions_by_state: InstitutionsByState[];
  program_distribution: ProgramDistributionPoint[];
  placement_overview: PlacementOverviewPoint[];
  top_institutions: TopInstitution[];
  recent_activity: RecentActivity[];
  recent_placements: RecentPlacement[];
  ai_insights: AiInsight[];
}

export const getAdminDashboard = () => fetchWithAuth("/api/v1/admin/dashboard") as Promise<AdminDashboard>;

// ---------- Institutions ----------

/** The backend only tracks active and inactive. There is no under-review state. */
export type InstitutionStatus = "active" | "inactive";

export interface Institution {
  id: string;
  name: string;
  type: string;
  state: string | null;
  district: string | null;
  address: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  accreditation_number: string | null;
  status: InstitutionStatus;
  trainees: number;
  trainers: number;
  programmes: number;
}

export interface InstitutionListQuery extends PageQuery {
  q?: string;
  state?: string;
  type?: string;
  status?: InstitutionStatus;
}

export const listInstitutions = (query: InstitutionListQuery = {}) =>
  listPaged<Institution, InstitutionListQuery>("/api/v1/admin/institutions", query);

export const getInstitution = (id: string) =>
  fetchWithAuth(`/api/v1/admin/institutions/${enc(id)}`) as Promise<Institution>;

export interface InstitutionInput {
  name: string;
  state: string;
  district?: string | null;
  address?: string | null;
  /** Six digits. */
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  accreditation_number?: string | null;
}

export interface InstitutionUpdate extends Partial<InstitutionInput> {
  is_active?: boolean;
}

export const createInstitution = (body: InstitutionInput) =>
  postJson<Institution>("/api/v1/admin/institutions", body);

export const updateInstitution = (id: string, body: InstitutionUpdate) =>
  patchJson<Institution>(`/api/v1/admin/institutions/${enc(id)}`, body);

// ---------- People (trainers, trainees, employers, users) ----------

/** Row shape returned by every person list and by the create and update endpoints. */
export interface PersonRow {
  id: string;
  full_name: string;
  email: string;
  role: PlatformRole;
  organisation_id: string | null;
  organisation_name: string | null;
  state: string | null;
  status: InstitutionStatus;
  created_at: string | null;
}

export type Trainer = PersonRow;
export type Trainee = PersonRow;
export type Employer = PersonRow;

export interface TrainerListQuery extends PageQuery {
  q?: string;
  /** Matched against the trainer's expertise list. */
  subject?: string;
  state?: string;
  status?: InstitutionStatus;
}

export interface TrainerInput {
  email: string;
  full_name: string;
  organisation_id?: string | null;
  phone?: string | null;
  state?: string | null;
  qualification?: string | null;
  /** Each entry 1 to 100 characters, at most 20 entries. */
  expertise?: string[] | null;
}

export const listTrainers = (query: TrainerListQuery = {}) =>
  listPaged<Trainer, TrainerListQuery>("/api/v1/admin/trainers", query);

export const createTrainer = (body: TrainerInput) => postJson<Trainer>("/api/v1/admin/trainers", body);

export interface TraineeListQuery extends PageQuery {
  q?: string;
  /** Programme UUID. */
  program?: string;
  state?: string;
  status?: InstitutionStatus;
}

export interface TraineeInput {
  email: string;
  full_name: string;
  organisation_id?: string | null;
  phone?: string | null;
  state?: string | null;
  programme_id?: string | null;
}

export const listTrainees = (query: TraineeListQuery = {}) =>
  listPaged<Trainee, TraineeListQuery>("/api/v1/admin/trainees", query);

export const enrollTrainee = (body: TraineeInput) => postJson<Trainee>("/api/v1/admin/trainees", body);

export const listEmployers = (query: PageQuery & { q?: string } = {}) =>
  listPaged<Employer, PageQuery & { q?: string }>("/api/v1/admin/employers", query);

/** Backend roles accepted by POST /users and PATCH /users/{id}. */
export type PlatformRole = "trainee" | "trainer" | "institution" | "employer" | "admin" | "ncct_admin";

export type UserRole = PlatformRole;

export interface AdminUser extends PersonRow {
  /** ISO timestamp of the last push-token activity, null when never seen. */
  last_active: string | null;
}

export interface UserListQuery extends PageQuery {
  q?: string;
  role?: PlatformRole;
  status?: InstitutionStatus;
}

export const listUsers = (query: UserListQuery = {}) =>
  listPaged<AdminUser, UserListQuery>("/api/v1/admin/users", query);

/**
 * Admin-created users are invite records. Authentication is handled by Clerk,
 * so no password (or any other credential) is ever sent from this client.
 */
export interface UserInput {
  email: string;
  full_name: string;
  role: PlatformRole;
  organisation_id?: string | null;
}

export interface UserUpdate {
  role?: PlatformRole;
  is_active?: boolean;
}

export const createUser = (body: UserInput) => postJson<AdminUser>("/api/v1/admin/users", body);

export const updateUser = (id: string, body: UserUpdate) =>
  patchJson<AdminUser>(`/api/v1/admin/users/${enc(id)}`, body);

// ---------- Training programmes ----------

export interface Programme {
  id: string;
  title: string;
  sector: string | null;
  level: string | null;
  mode: string | null;
  duration_weeks: number | null;
  seats_total: number;
  seats_filled: number;
  organisation_name: string | null;
  start_date: string | null;
  status: InstitutionStatus;
}

export interface ProgrammeListQuery extends PageQuery {
  q?: string;
  status?: InstitutionStatus;
}

export const listProgrammes = (query: ProgrammeListQuery = {}) =>
  listPaged<Programme, ProgrammeListQuery>("/api/v1/admin/programmes", query);

export interface ProgrammeInput {
  title: string;
  sector?: string | null;
  level?: string | null;
  mode?: string | null;
  /** 1 to 520. */
  duration_weeks?: number | null;
  /** 0 to 100000, defaults to 0 on the server. */
  seats_total?: number;
  organisation_id?: string | null;
  start_date?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface ProgrammeCreated {
  id: string;
  title: string;
  sector: string | null;
  seats_total: number;
  status: InstitutionStatus;
}

export const createProgramme = (body: ProgrammeInput) =>
  postJson<ProgrammeCreated>("/api/v1/admin/programmes", body);

// ---------- Skill passport ----------

export interface SkillPassportRow {
  skill_id: string;
  skill: string;
  category: string | null;
  verified_count: number;
  trainees: number;
  avg_proficiency: number | null;
}

export const getSkillPassport = (query: PageQuery & { q?: string } = {}) =>
  listPaged<SkillPassportRow, PageQuery & { q?: string }>("/api/v1/admin/skill-passport", query);

// ---------- Jobs & placements ----------

export type JobStatus = "draft" | "open" | "closed";

export interface Job {
  id: string;
  title: string;
  employer_name: string;
  location: string | null;
  job_type: string;
  openings: number | null;
  status: JobStatus;
  source: string;
  applicants: number;
  posted_at: string | null;
}

export interface JobListQuery extends PageQuery {
  q?: string;
  status?: JobStatus;
}

export const listJobs = (query: JobListQuery = {}) => listPaged<Job, JobListQuery>("/api/v1/admin/jobs", query);

export interface JobInput {
  title: string;
  employer_name: string;
  location?: string | null;
  /** Server default: "Cooperative". */
  sector?: string;
  /** Server default: "Full-time". */
  job_type?: string;
  salary_range?: string | null;
  description?: string | null;
  skills_required?: string[] | null;
  openings?: number | null;
  /** ISO 8601 timestamp. */
  deadline?: string | null;
  /** Server default: "open". */
  status?: "draft" | "open";
}

export interface JobCreated {
  id: string;
  title: string;
  employer_name: string;
  status: JobStatus;
  source: string;
  posted_at: string | null;
}

export const createJob = (body: JobInput) => postJson<JobCreated>("/api/v1/admin/jobs", body);

export interface Placement {
  id: string;
  candidate_name: string;
  role: string;
  employer: string;
  date: string | null;
}

export const listPlacements = (query: PageQuery & { q?: string } = {}) =>
  listPaged<Placement, PageQuery & { q?: string }>("/api/v1/admin/placements", query);

// ---------- Assessments ----------

export interface Assessment {
  id: string;
  title: string;
  skill_name: string | null;
  programme_id: string | null;
  programme_title: string | null;
  total_questions: number;
  duration_minutes: number;
  passing_score: number;
  due_date: string | null;
  attempts: number;
}

export const listAssessments = (query: PageQuery & { q?: string } = {}) =>
  listPaged<Assessment, PageQuery & { q?: string }>("/api/v1/admin/assessments", query);

export interface AssessmentInput {
  title: string;
  programme_id?: string | null;
  course_id?: string | null;
  skill_name?: string | null;
  /** 1 to 500, default 25. */
  total_questions?: number;
  /** 1 to 600, default 45. */
  duration_minutes?: number;
  /** 0 to 100, default 60. */
  passing_score?: number;
  due_date?: string | null;
  /** 1 to 10, default 3. */
  max_attempts?: number;
  show_answers?: "after_submit" | "never";
}

export interface AssessmentCreated {
  id: string;
  title: string;
  passing_score: number;
}

export const createAssessment = (body: AssessmentInput) =>
  postJson<AssessmentCreated>("/api/v1/admin/assessments", body);

// ---------- Certifications ----------

export type CertificationStatus = "valid" | "revoked" | "expired";

export interface Certification {
  id: string;
  verification_code: string;
  holder_name: string;
  programme_title: string | null;
  grade: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: CertificationStatus;
}

export interface CertificationListQuery extends PageQuery {
  q?: string;
  status?: CertificationStatus;
}

export const listCertifications = (query: CertificationListQuery = {}) =>
  listPaged<Certification, CertificationListQuery>("/api/v1/admin/certifications", query);

export interface CertificationVerification {
  id: string;
  verification_code: string;
  status: "valid" | "revoked";
  /** "ok" and "failed" come from the integrity check. "unverified" means no signing secret is configured. */
  integrity: "ok" | "failed" | "unverified";
}

export const verifyCertification = (id: string) =>
  postJson<CertificationVerification>(`/api/v1/admin/certifications/${enc(id)}/verify`, {});

// ---------- Reports ----------

export type ReportKey = "enrollment" | "placements" | "assessments" | "certifications";

export interface ReportResponse {
  key: ReportKey;
  columns: string[];
  rows: (string | number | null)[][];
  chart: {
    type: string;
    labels: string[];
    series: { name: string; values: number[] }[];
  };
}

export const getReport = (key: ReportKey) =>
  fetchWithAuth(`/api/v1/admin/reports/${key}`) as Promise<ReportResponse>;

export function reportExportUrl(key: ReportKey): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${base}/api/v1/admin/reports/${key}/export?format=csv`;
}

// ---------- Platform settings ----------

export type DigestFrequency = "daily" | "weekly" | "monthly";

export interface GeneralSettings {
  org_name: string;
  admin_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
}

export interface AppearanceSettings {
  accent_color: string;
  density: "compact" | "comfortable";
}

export interface NotificationSettings {
  email_enabled: boolean;
  weekly_digest: boolean;
  placement_alerts: boolean;
  digest_frequency: DigestFrequency;
}

export interface SecuritySettings {
  session_timeout_minutes: number;
  mfa_required: boolean;
  password_min_length: number;
  allowed_email_domains: string[];
}

export interface PlatformSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

/** Partial update. Each section takes only the fields it changes. */
export interface SettingsPatch {
  general?: Partial<GeneralSettings>;
  appearance?: Partial<AppearanceSettings>;
  notifications?: Partial<NotificationSettings>;
  security?: Partial<SecuritySettings>;
}

export const getSettings = () => fetchWithAuth("/api/v1/admin/settings") as Promise<PlatformSettings>;

export const updateSettings = (body: SettingsPatch) =>
  patchJson<PlatformSettings>("/api/v1/admin/settings", body);

// ---------- Audit logs ----------

export interface AuditLog {
  id: string;
  actor_name: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
  meta: Record<string, unknown> | null;
}

export const listAuditLogs = (query: PageQuery & { q?: string } = {}) =>
  listPaged<AuditLog, PageQuery & { q?: string }>("/api/v1/admin/audit-logs", query);
