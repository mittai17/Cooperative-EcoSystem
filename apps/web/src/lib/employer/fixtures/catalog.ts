import type {
  EmployerJob,
  EmployerJobDetail,
  JobRequirement,
  JobStatus,
} from "@/lib/employer/jobs-api";
import type {
  CompanyProfile,
  EmployerSettings,
  TeamResponse,
} from "@/lib/employer/workflow-api";

export const mockCompanyProfile: CompanyProfile = {
  name: "Amul Cooperative Union (GCMMF)",
  sector: "Dairy, Agri-Food Processing & Supply Chain",
  description: "Gujarat Cooperative Milk Marketing Federation Ltd. (GCMMF) is India's largest food products marketing organization, empowering millions of dairy farmers across thousands of village cooperatives.",
  location: "Anand, Gujarat, India",
  website: "https://www.amul.com",
  contact_email: "recruitment@amul.coop",
  contact_phone: "+91 2692 258506",
  departments: [
    "Dairy Processing & Plant Automation",
    "Cold Chain Logistics & Distribution",
    "Quality Assurance & Laboratory Services",
    "Cooperative Member Relations",
    "Renewable Energy & Sustainability",
  ],
};

export const mockTeamResponse: TeamResponse = {
  current_role: "employer_admin",
  members: [
    {
      id: "tm-1",
      name: "Dr. R. S. Sodhi",
      email: "rsodhi@amul.coop",
      role: "employer_admin",
      status: "active",
      last_active: "2026-09-26T16:45:00Z",
    },
    {
      id: "tm-2",
      name: "Meera Trivedi",
      email: "mtrivedi@amul.coop",
      role: "recruiter",
      status: "active",
      last_active: "2026-09-26T12:20:00Z",
    },
    {
      id: "tm-3",
      name: "Harish Patel",
      email: "hpatel@amul.coop",
      role: "hiring_manager",
      status: "active",
      last_active: "2026-09-25T09:05:00Z",
    },
    {
      id: "tm-4",
      name: "Anita Desai",
      email: "adesai@amul.coop",
      role: "recruiter",
      status: "invited",
      last_active: null,
    },
  ],
};

export const mockSettings: EmployerSettings = {
  account: {
    name: "Dr. R. S. Sodhi",
    email: "rsodhi@amul.coop",
    role: "employer_admin",
  },
  notifications: {
    interview_reminders: true,
    new_application: true,
    candidate_response: true,
    job_deadline: false,
  },
};

export const mockEmployerJobs: EmployerJob[] = [
  {
    id: "emp-job-dairy-supervisor",
    title: "Dairy Procurement Supervisor",
    department: "Procurement & Quality",
    location: "Anand, Gujarat",
    employment_type: "Full-time",
    status: "open",
    salary_range: "₹22,000 - ₹28,000 / month",
    openings: 4,
    applications_count: 38,
    shortlisted_count: 14,
    interview_count: 6,
    match_rate: 94,
    posted_at: "2026-09-01T09:00:00.000Z",
    deadline: "2026-10-31T18:00:00.000Z",
  },
  {
    id: "emp-job-quality-analyst",
    title: "Quality & Compliance Analyst",
    department: "Quality Assurance",
    location: "Anand, Gujarat",
    employment_type: "Full-time",
    status: "open",
    salary_range: "₹26,000 - ₹34,000 / month",
    openings: 2,
    applications_count: 24,
    shortlisted_count: 9,
    interview_count: 4,
    match_rate: 88,
    posted_at: "2026-09-05T10:30:00.000Z",
    deadline: "2026-11-15T18:00:00.000Z",
  },
  {
    id: "emp-job-mis-analyst",
    title: "MIS & Data Analyst - Cooperative Sector",
    department: "Information Technology",
    location: "New Delhi",
    employment_type: "Full-time",
    status: "open",
    salary_range: "₹35,000 - ₹45,000 / month",
    openings: 2,
    applications_count: 42,
    shortlisted_count: 12,
    interview_count: 5,
    match_rate: 91,
    posted_at: "2026-09-10T11:00:00.000Z",
    deadline: "2026-11-20T18:00:00.000Z",
  },
  {
    id: "emp-job-society-accountant",
    title: "Cooperative Society Accountant",
    department: "Finance & Accounts",
    location: "Pune, Maharashtra",
    employment_type: "Full-time",
    status: "open",
    salary_range: "₹18,000 - ₹24,000 / month",
    openings: 2,
    applications_count: 29,
    shortlisted_count: 8,
    interview_count: 3,
    match_rate: 85,
    posted_at: "2026-09-12T08:00:00.000Z",
    deadline: "2026-10-25T18:00:00.000Z",
  },
  {
    id: "emp-job-store-manager",
    title: "Retail Store Manager - Cooperative Brand",
    department: "Marketing & Retail",
    location: "Vadodara, Gujarat",
    employment_type: "Full-time",
    status: "paused",
    salary_range: "₹19,000 - ₹25,000 / month",
    openings: 1,
    applications_count: 16,
    shortlisted_count: 5,
    interview_count: 2,
    match_rate: 82,
    posted_at: "2026-08-20T14:00:00.000Z",
    deadline: "2026-10-15T18:00:00.000Z",
  },
  {
    id: "emp-job-fpo-coordinator",
    title: "FPO Operations Coordinator",
    department: "Operations",
    location: "Surat, Gujarat",
    employment_type: "Full-time",
    status: "draft",
    salary_range: "₹25,000 - ₹32,000 / month",
    openings: 3,
    applications_count: 0,
    shortlisted_count: 0,
    interview_count: 0,
    match_rate: null,
    posted_at: null,
    deadline: null,
  },
  {
    id: "emp-job-cold-chain",
    title: "Cold Chain Logistics Coordinator",
    department: "Cold Chain Logistics & Distribution",
    location: "Anand, Gujarat",
    employment_type: "Full-time",
    status: "open",
    salary_range: "₹24,000 - ₹30,000 / month",
    openings: 3,
    applications_count: 21,
    shortlisted_count: 7,
    interview_count: 3,
    match_rate: 86,
    posted_at: "2026-09-16T07:30:00.000Z",
    deadline: "2026-11-08T18:00:00.000Z",
  },
  {
    id: "emp-job-pacs-trainee",
    title: "PACS Management Trainee",
    department: "Cooperative Member Relations",
    location: "Kheda, Gujarat",
    employment_type: "Internship",
    status: "open",
    salary_range: "₹15,000 - ₹18,000 / month",
    openings: 6,
    applications_count: 33,
    shortlisted_count: 11,
    interview_count: 4,
    match_rate: 90,
    posted_at: "2026-09-18T06:15:00.000Z",
    deadline: "2026-12-01T18:00:00.000Z",
  },
];

export const JOB_REQUIREMENTS: Record<string, JobRequirement[]> = {
  "emp-job-dairy-supervisor": [
    { skill_id: "sk-1", skill_name: "Dairy Operations", requirement_type: "required", min_proficiency: 70 },
    { skill_id: "sk-2", skill_name: "Quality Testing", requirement_type: "required", min_proficiency: 70 },
    { skill_id: "sk-3", skill_name: "Logistics Planning", requirement_type: "preferred", min_proficiency: 50 },
    { skill_id: "sk-4", skill_name: "Cold Chain Handling", requirement_type: "preferred", min_proficiency: 50 },
  ],
  "emp-job-quality-analyst": [
    { skill_id: "sk-2", skill_name: "Quality Testing", requirement_type: "required", min_proficiency: 75 },
    { skill_id: "sk-5", skill_name: "Documentation", requirement_type: "required", min_proficiency: 60 },
    { skill_id: "sk-6", skill_name: "Food Safety", requirement_type: "preferred", min_proficiency: 60 },
    { skill_id: "sk-7", skill_name: "HACCP", requirement_type: "preferred", min_proficiency: 50 },
  ],
  "emp-job-mis-analyst": [
    { skill_id: "sk-8", skill_name: "Data Analysis", requirement_type: "required", min_proficiency: 80 },
    { skill_id: "sk-9", skill_name: "Spreadsheets", requirement_type: "required", min_proficiency: 80 },
    { skill_id: "sk-10", skill_name: "Dashboarding", requirement_type: "preferred", min_proficiency: 70 },
    { skill_id: "sk-11", skill_name: "Python", requirement_type: "preferred", min_proficiency: 50 },
  ],
  "emp-job-society-accountant": [
    { skill_id: "sk-12", skill_name: "Bookkeeping", requirement_type: "required", min_proficiency: 75 },
    { skill_id: "sk-13", skill_name: "Tally", requirement_type: "required", min_proficiency: 75 },
    { skill_id: "sk-14", skill_name: "Statutory Compliance", requirement_type: "required", min_proficiency: 65 },
    { skill_id: "sk-15", skill_name: "Cooperative Accounting", requirement_type: "preferred", min_proficiency: 60 },
  ],
  "emp-job-store-manager": [
    { skill_id: "sk-16", skill_name: "Retail Operations", requirement_type: "required", min_proficiency: 70 },
    { skill_id: "sk-17", skill_name: "Digital Marketing", requirement_type: "required", min_proficiency: 55 },
    { skill_id: "sk-18", skill_name: "E-commerce", requirement_type: "preferred", min_proficiency: 50 },
  ],
  "emp-job-fpo-coordinator": [
    { skill_id: "sk-19", skill_name: "Cooperative Management", requirement_type: "required", min_proficiency: 70 },
    { skill_id: "sk-20", skill_name: "Supply Chain Logistics", requirement_type: "required", min_proficiency: 65 },
    { skill_id: "sk-21", skill_name: "Rural Development", requirement_type: "preferred", min_proficiency: 50 },
  ],
  "emp-job-cold-chain": [
    { skill_id: "sk-4", skill_name: "Cold Chain Handling", requirement_type: "required", min_proficiency: 75 },
    { skill_id: "sk-3", skill_name: "Logistics Planning", requirement_type: "required", min_proficiency: 65 },
    { skill_id: "sk-2", skill_name: "Quality Testing", requirement_type: "preferred", min_proficiency: 50 },
  ],
  "emp-job-pacs-trainee": [
    { skill_id: "sk-22", skill_name: "Cooperative Operations", requirement_type: "required", min_proficiency: 50 },
    { skill_id: "sk-19", skill_name: "Cooperative Management", requirement_type: "required", min_proficiency: 50 },
    { skill_id: "sk-23", skill_name: "Member Relations", requirement_type: "preferred", min_proficiency: 50 },
  ],
};

const DEFAULT_REQUIREMENTS: JobRequirement[] = [
  { skill_id: "sk-1", skill_name: "Dairy Operations", requirement_type: "required", min_proficiency: 70 },
  { skill_id: "sk-2", skill_name: "Quality Testing", requirement_type: "required", min_proficiency: 70 },
  { skill_id: "sk-3", skill_name: "Logistics Planning", requirement_type: "preferred", min_proficiency: 50 },
];

const DETAIL_SALARY: Record<string, { min: number; max: number }> = {
  "emp-job-dairy-supervisor": { min: 22000, max: 28000 },
  "emp-job-quality-analyst": { min: 26000, max: 34000 },
  "emp-job-mis-analyst": { min: 35000, max: 45000 },
  "emp-job-society-accountant": { min: 18000, max: 24000 },
  "emp-job-store-manager": { min: 19000, max: 25000 },
  "emp-job-fpo-coordinator": { min: 25000, max: 32000 },
  "emp-job-cold-chain": { min: 24000, max: 30000 },
  "emp-job-pacs-trainee": { min: 15000, max: 18000 },
};

const DETAIL_RESPONSIBILITIES: Record<string, string> = {
  "emp-job-dairy-supervisor":
    "- Supervise daily milk procurement and collection routes across PACS societies\n- Verify FAT/SNF automated testing calibration and digital register logs\n- Coordinate chilling plant handover and cold chain transport schedules\n- Support primary society secretaries with member dispatch reconciliation and DBT payouts",
  "emp-job-quality-analyst":
    "- Run FAT/SNF, antibiotic residue and somatic cell count checks on the daily draw\n- Maintain the FSSAI licence file, HACCP plan and monthly calibration log\n- Audit lab consumable usage and reject lots with traceability intact\n- Train village society testers on sampling and analyser SOPs",
  "emp-job-mis-analyst":
    "- Build state-level dashboards for procurement, dispatch and member payout data\n- Standardise MIS returns from district unions and state federations\n- Automate the monthly NCCT format returns and reduce manual reconciliation\n- Publish data quality dashboards used by the federation board",
  "emp-job-society-accountant":
    "- Maintain society ledgers, cash book and member share registers\n- Prepare monthly, quarterly and annual statutory returns for the society\n- Support the annual audit and the AGM financial statements\n- Reconcile member dividend and DBT payouts against bank statements",
  "emp-job-store-manager":
    "- Run daily retail counter operations for the cooperative brand store\n- Manage stock, shelf life and daily closing of the cooperative outlet\n- Drive footfall through ONDC, WhatsApp and local market promotions\n- Handle cash handover and daily stock statements",
  "emp-job-fpo-coordinator":
    "- Aggregate produce from farmer producer groups across the district\n- Plan warehousing, grading and offtake for the FPO supply calendar\n- Maintain farmer records, procurement slips and payment cycles\n- Coordinate with FPO promoters and transporters on dispatch",
  "emp-job-cold-chain":
    "- Plan reefer dispatch for pooled milk, dairy products and fodder\n- Monitor temperature telemetry and raise deviations before product loss\n- Verify vehicle pre-cooling, cleaning and documentation per trip\n- Reduce route mileage through consolidation planning",
  "emp-job-pacs-trainee":
    "- Shadow the society secretary on milk collection and member records\n- Assist in daily dispatch slips, register entries and reconciliation\n- Learn member service, meeting minutes and cooperative governance norms\n- Support village-level member awareness camps",
};

export function findMockJob(id: string): EmployerJob | undefined {
  return mockEmployerJobs.find((job) => job.id === id);
}

export function getMockEmployerJobDetail(id: string): EmployerJobDetail | null {
  const base = findMockJob(id);
  if (!base) return null;
  const salary = DETAIL_SALARY[id] ?? { min: 18000, max: 24000 };
  return {
    ...base,
    company_name: "Amul Dairy Cooperative Union",
    sector: "Dairy & Agri-processing",
    experience_required: "2+ years in rural cooperative or dairy operations",
    education: "Bachelor's Degree in Agriculture, Food Tech, or Rural Management",
    description: `We are seeking a dedicated professional for the role of ${base.title}. You will oversee village cooperative collection points, coordinate cold-chain logistics, and ensure compliance with NCCT cooperative standards and food quality regulations.`,
    responsibilities: DETAIL_RESPONSIBILITIES[id] ?? DETAIL_RESPONSIBILITIES["emp-job-dairy-supervisor"],
    certifications: "NCCT Dairy Management Certificate or equivalent food quality certification preferred",
    languages: "Gujarati, Hindi, English",
    salary_min: salary.min,
    salary_max: salary.max,
    requirements: JOB_REQUIREMENTS[id] ?? DEFAULT_REQUIREMENTS,
    pipeline: {
      applied: base.applications_count,
      shortlisted: base.shortlisted_count,
      interview: base.interview_count,
      offered: Math.min(base.openings ?? 2, Math.max(1, Math.floor(base.interview_count / 2))),
      hired: Math.max(1, Math.floor(base.interview_count / 3)),
    },
  };
}

export function applyMockJobStatus(id: string, status: JobStatus): { id: string; status: JobStatus } {
  const job = findMockJob(id);
  if (!job) throw new Error(`Unknown employer job ${id}`);
  job.status = status;
  if (status === "open" && !job.posted_at) job.posted_at = new Date().toISOString();
  return { id, status };
}

export const FALLBACK_SKILL_CATALOGUE: string[] = [
  "Accounting",
  "Bookkeeping",
  "Cooperative Accounting",
  "Cooperative Finance",
  "Cooperative Management",
  "Cooperative Operations",
  "Credit Appraisal",
  "Dashboarding",
  "Data Analysis",
  "Digital Marketing",
  "Dairy Operations",
  "Dairy Management",
  "E-commerce",
  "Food Safety",
  "HACCP",
  "Leadership",
  "Logistics Planning",
  "Member Relations",
  "Python",
  "Quality Control",
  "Quality Testing",
  "Retail Operations",
  "Rural Development",
  "Six Sigma Basics",
  "Spreadsheets",
  "Statutory Compliance",
  "Supply Chain Logistics",
  "Tally",
];

export const mockSkillDemand: { skill: string; demand_count: number }[] = FALLBACK_SKILL_CATALOGUE.map(
  (skill, index) => ({ skill, demand_count: 62 - index * 2 }),
);