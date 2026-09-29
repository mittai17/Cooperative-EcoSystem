export interface CooperativeJob {
  id: string;
  title: string;
  employer: string;
  location: string;
  sector: string;
  type: string;
  salary: string;
  openings: number;
  description: string;
  skills_required: string[];
  posted_days_ago?: number;
  status: 'open' | 'draft' | 'closed';
  deadline?: string;
  applicants_count?: number;
}

export interface CandidateSkill {
  name: string;
  level: 'Foundation' | 'Intermediate' | 'Advanced' | 'Proficient';
  confidence: number;
  verified: boolean;
  hours?: number;
  evidence?: string;
}

export interface CandidateCertificate {
  id: string;
  title: string;
  issuer: string;
  verification_code: string;
  issue_date: string;
  verification_state: 'valid' | 'expired' | 'unverified';
}

export interface JobApplicant {
  id: string;
  job_id: string;
  trainee_id: string;
  name: string;
  avatar_initials: string;
  location: string;
  status: 'applied' | 'shortlisted' | 'interview' | 'offered' | 'hired' | 'rejected';
  applied_at: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  verified_skill_count: number;
  institute: string;
  attendance_percentage: number;
  occupation: string;
  interview_at?: string;
  employer_note?: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  occupation: string;
  bio: string;
  education_level: string;
  years_of_experience: number;
  institute_attended: string;
  attendance_percentage: number;
  total_training_hours: number;
  passport_id: string;
  skills: CandidateSkill[];
  certificates: CandidateCertificate[];
}

export const COOP_SECTORS = [
  'Dairy',
  'Credit & Banking',
  'Sugar',
  'Handloom & Textiles',
  'Fisheries',
  'Agriculture & Marketing',
  'Consumer Cooperatives',
] as const;

export const COMPETENCY_TAXONOMY = [
  'Dairy Operations',
  'Cold Chain Management',
  'Cooperative Management',
  'PACS ERP & Accounting',
  'Credit Appraisal',
  'NPA Recovery & Loan Monitoring',
  'Cooperative Law & Governance',
  'Member Relations & Mobilization',
  'Rural Development',
  'Financial Management',
  'Digital Marketing for Cooperatives',
  'Statutory Cooperative Audit',
  'Handloom Weaving & Dyeing',
  'Fish Hatchery Management',
  'Post-Harvest Cold Storage',
  'Quality Control & Milk Testing',
  'Communication & Facilitation',
  'Leadership in Cooperatives',
];

export const INITIAL_JOBS: CooperativeJob[] = [
  {
    id: 'job-dairy-supervisor-anand',
    title: 'Dairy Procurement Supervisor',
    employer: 'Amul Dairy Cooperative Union',
    location: 'Anand, Gujarat',
    sector: 'Dairy',
    type: 'Full-time',
    salary: '₹4,50,000 - ₹6,00,000 / year',
    openings: 5,
    description:
      'Responsible for village-level primary dairy cooperative society milk collection, bulk milk cooling unit (BMC) monitoring, milk quality testing, and chilling logistics management.',
    skills_required: ['Dairy Operations', 'Quality Control & Milk Testing', 'Communication & Facilitation', 'Cold Chain Management'],
    posted_days_ago: 2,
    status: 'open',
    deadline: '2026-10-31',
    applicants_count: 8,
  },
  {
    id: 'job-cdo-ncdc',
    title: 'Cooperative Development Officer',
    employer: 'National Cooperative Development Corporation (NCDC)',
    location: 'New Delhi / Regional Office',
    sector: 'Cooperative Management',
    type: 'Full-time',
    salary: '₹5,50,000 - ₹7,00,000 / year',
    openings: 3,
    description:
      'Evaluate new cooperative development schemes, monitor PACS computerization adoption, and conduct institutional capacity building workshops in designated districts.',
    skills_required: ['Cooperative Management', 'Rural Development', 'Cooperative Law & Governance', 'Financial Management'],
    posted_days_ago: 5,
    status: 'open',
    deadline: '2026-11-15',
    applicants_count: 14,
  },
  {
    id: 'job-credit-officer-pune',
    title: 'Credit Officer - Cooperative Bank',
    employer: 'Maharashtra State Cooperative Bank',
    location: 'Pune, Maharashtra',
    sector: 'Credit & Banking',
    type: 'Full-time',
    salary: '₹3,80,000 - ₹5,20,000 / year',
    openings: 8,
    description:
      'Appraise agricultural crop loans, Kisan Credit Card (KCC) portfolios, SHG bank linkage programs, and assist with statutory cooperative auditing and NPA risk mitigation.',
    skills_required: ['Credit Appraisal', 'PACS ERP & Accounting', 'Financial Management', 'Statutory Cooperative Audit'],
    posted_days_ago: 3,
    status: 'open',
    deadline: '2026-10-25',
    applicants_count: 11,
  },
  {
    id: 'job-agri-marketing-jaipur',
    title: 'Agri-Marketing & FPO Coordinator',
    employer: 'Rajasthan Cooperative Marketing Federation (RAJFED)',
    location: 'Jaipur, Rajasthan',
    sector: 'Agriculture & Marketing',
    type: 'Full-time',
    salary: '₹3,50,000 - ₹4,80,000 / year',
    openings: 4,
    description:
      'Coordinate procurement of pulses and oilseeds from farmer producer organizations (FPOs), manage MSP operations, and oversee warehouse receipt logistics.',
    skills_required: ['Digital Marketing for Cooperatives', 'Communication & Facilitation', 'Rural Development', 'Cooperative Management'],
    posted_days_ago: 8,
    status: 'open',
    deadline: '2026-11-05',
    applicants_count: 6,
  },
  {
    id: 'job-sugar-chemist-kolhapur',
    title: 'Cooperative Sugar Mill Operations Trainee',
    employer: 'Shree Chhatrapati Shahu Cooperative Sugar Factory',
    location: 'Kolhapur, Maharashtra',
    sector: 'Sugar',
    type: 'Internship',
    salary: '₹2,40,000 - ₹3,20,000 / year',
    openings: 6,
    description:
      'Hands-on operations in cooperative sugar manufacturing, bagasse cogeneration plant monitoring, and farmer cane-cutting accounting systems.',
    skills_required: ['Cooperative Management', 'Quality Control & Milk Testing', 'Member Relations & Mobilization'],
    posted_days_ago: 12,
    status: 'open',
    deadline: '2026-10-20',
    applicants_count: 4,
  },
];

export const INITIAL_APPLICANTS: JobApplicant[] = [
  {
    id: 'app-001',
    job_id: 'job-dairy-supervisor-anand',
    trainee_id: 'trainee-pooja-patel',
    name: 'Pooja Patel',
    avatar_initials: 'PP',
    location: 'Anand, Gujarat',
    status: 'shortlisted',
    applied_at: '2026-09-24',
    match_score: 95,
    matched_skills: ['Dairy Operations', 'Quality Control & Milk Testing', 'Cold Chain Management'],
    missing_skills: [],
    verified_skill_count: 6,
    institute: 'RICM Anand (Gujarat)',
    attendance_percentage: 97,
    occupation: 'Certified Dairy Technician',
    employer_note: 'High academic rank at RICM Anand. Practical dairy chilling plant experience.',
  },
  {
    id: 'app-002',
    job_id: 'job-dairy-supervisor-anand',
    trainee_id: 'trainee-rahul-deshmukh',
    name: 'Rahul Deshmukh',
    avatar_initials: 'RD',
    location: 'Pune, Maharashtra',
    status: 'interview',
    applied_at: '2026-09-22',
    match_score: 88,
    matched_skills: ['Dairy Operations', 'Communication & Facilitation'],
    missing_skills: ['Cold Chain Management'],
    verified_skill_count: 5,
    institute: 'VAMNICOM Pune',
    attendance_percentage: 94,
    occupation: 'Cooperative Operations Associate',
    interview_at: '2026-10-05T10:30:00Z',
    employer_note: 'Interview scheduled via Google Meet with Anand HR panel.',
  },
  {
    id: 'app-003',
    job_id: 'job-dairy-supervisor-anand',
    trainee_id: 'trainee-anita-meena',
    name: 'Anita Meena',
    avatar_initials: 'AM',
    location: 'Jaipur, Rajasthan',
    status: 'applied',
    applied_at: '2026-09-26',
    match_score: 82,
    matched_skills: ['Quality Control & Milk Testing', 'Communication & Facilitation'],
    missing_skills: ['Cold Chain Management'],
    verified_skill_count: 4,
    institute: 'ICM Jaipur',
    attendance_percentage: 92,
    occupation: 'Agriculture Extension Trainee',
  },
  {
    id: 'app-004',
    job_id: 'job-dairy-supervisor-anand',
    trainee_id: 'trainee-suresh-kumar',
    name: 'Suresh Kumar',
    avatar_initials: 'SK',
    location: 'Madurai, Tamil Nadu',
    status: 'offered',
    applied_at: '2026-09-18',
    match_score: 91,
    matched_skills: ['Dairy Operations', 'Cold Chain Management', 'Quality Control & Milk Testing'],
    missing_skills: [],
    verified_skill_count: 7,
    institute: 'ICM Madurai',
    attendance_percentage: 98,
    occupation: 'Senior Cooperative Dairy Inspector',
    employer_note: 'Offer letter extended: ₹5,40,000 CTC. Joining date 1 Nov 2026.',
  },
  {
    id: 'app-005',
    job_id: 'job-cdo-ncdc',
    trainee_id: 'trainee-pooja-patel',
    name: 'Pooja Patel',
    avatar_initials: 'PP',
    location: 'Anand, Gujarat',
    status: 'applied',
    applied_at: '2026-09-25',
    match_score: 90,
    matched_skills: ['Cooperative Management', 'Rural Development'],
    missing_skills: ['Cooperative Law & Governance'],
    verified_skill_count: 6,
    institute: 'RICM Anand (Gujarat)',
    attendance_percentage: 97,
    occupation: 'Certified Dairy Technician',
  },
  {
    id: 'app-006',
    job_id: 'job-credit-officer-pune',
    trainee_id: 'trainee-vikram-singh',
    name: 'Vikram Singh',
    avatar_initials: 'VS',
    location: 'Nagpur, Maharashtra',
    status: 'shortlisted',
    applied_at: '2026-09-21',
    match_score: 92,
    matched_skills: ['Credit Appraisal', 'PACS ERP & Accounting', 'Financial Management'],
    missing_skills: [],
    verified_skill_count: 5,
    institute: 'VAMNICOM Pune',
    attendance_percentage: 96,
    occupation: 'Cooperative Banking Analyst',
  },
];

export const CANDIDATE_PROFILES: Record<string, CandidateProfile> = {
  'trainee-pooja-patel': {
    id: 'trainee-pooja-patel',
    name: 'Pooja Patel',
    email: 'pooja.patel@coop.in',
    phone: '+91 98765 43210',
    location: 'Anand, Gujarat',
    occupation: 'Certified Dairy Operations Specialist',
    bio: 'Dedicated graduate of RICM Anand with extensive practical training in Amul district milk cooperative unions. Specialized in automated BMC chilling, bacteriological testing, and producer society accounting.',
    education_level: 'B.Sc. Dairy Science & Cooperative Management',
    years_of_experience: 2,
    institute_attended: 'RICM Anand (Gujarat)',
    attendance_percentage: 97.4,
    total_training_hours: 360,
    passport_id: 'NCCT-2026-GUJ-8492',
    skills: [
      { name: 'Dairy Operations', level: 'Proficient', confidence: 96, verified: true, hours: 120, evidence: 'RICM Anand Dairy Lab - Grade A' },
      { name: 'Quality Control & Milk Testing', level: 'Advanced', confidence: 94, verified: true, hours: 80, evidence: 'Amul Chilling Center Assessment' },
      { name: 'Cold Chain Management', level: 'Advanced', confidence: 91, verified: true, hours: 60, evidence: 'NCCT Cold Storage Logistics Board' },
      { name: 'Cooperative Management', level: 'Intermediate', confidence: 88, verified: true, hours: 40, evidence: 'VAMNICOM Co-op Principles Certificate' },
      { name: 'PACS ERP & Accounting', level: 'Intermediate', confidence: 82, verified: true, hours: 35, evidence: 'NABARD PACS ERP Module Exam' },
      { name: 'Communication & Facilitation', level: 'Proficient', confidence: 89, verified: true, hours: 25, evidence: 'District Cooperative Federation Viva' },
    ],
    certificates: [
      {
        id: 'cert-ncct-001',
        title: 'Higher Diploma in Cooperative Dairy Operations',
        issuer: 'Regional Institute of Cooperative Management, Anand',
        verification_code: 'NCCT-HDCDO-2026-0914',
        issue_date: '2026-06-15',
        verification_state: 'valid',
      },
      {
        id: 'cert-ncct-002',
        title: 'Micro-Credential in Milk Quality Assurance & Cold Chain',
        issuer: 'National Council for Cooperative Training (NCCT)',
        verification_code: 'NCCT-MC-MQACC-8821',
        issue_date: '2026-08-10',
        verification_state: 'valid',
      },
      {
        id: 'cert-ncct-003',
        title: 'PACS Computerization & Statutory Compliance',
        issuer: 'Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM)',
        verification_code: 'VAMN-PACS-2026-4401',
        issue_date: '2026-04-20',
        verification_state: 'valid',
      },
    ],
  },
  'trainee-rahul-deshmukh': {
    id: 'trainee-rahul-deshmukh',
    name: 'Rahul Deshmukh',
    email: 'rahul.deshmukh@coop.in',
    phone: '+91 97654 32109',
    location: 'Pune, Maharashtra',
    occupation: 'Cooperative Operations Associate',
    bio: 'VAMNICOM alumnus with deep background in agricultural marketing federations and dairy society supply chains across Western Maharashtra.',
    education_level: 'Post Graduate Diploma in Cooperative Business Management (PGDCBM)',
    years_of_experience: 3,
    institute_attended: 'VAMNICOM Pune',
    attendance_percentage: 94.2,
    total_training_hours: 420,
    passport_id: 'NCCT-2026-MAH-1102',
    skills: [
      { name: 'Cooperative Management', level: 'Proficient', confidence: 95, verified: true, hours: 140, evidence: 'VAMNICOM Board Examination' },
      { name: 'Dairy Operations', level: 'Intermediate', confidence: 86, verified: true, hours: 80, evidence: 'Mahanand Dairy Practical' },
      { name: 'Credit Appraisal', level: 'Intermediate', confidence: 84, verified: true, hours: 60, evidence: 'MSCB Credit Training Wing' },
      { name: 'Communication & Facilitation', level: 'Advanced', confidence: 92, verified: true, hours: 50, evidence: 'State Cooperative Union Workshop' },
    ],
    certificates: [
      {
        id: 'cert-ncct-004',
        title: 'PG Diploma in Cooperative Business Management',
        issuer: 'VAMNICOM Pune',
        verification_code: 'VAMN-PGDCBM-2026-0042',
        issue_date: '2026-05-30',
        verification_state: 'valid',
      },
    ],
  },
};
