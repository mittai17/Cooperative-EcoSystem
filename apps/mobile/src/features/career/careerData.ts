export interface CareerJob {
  id: string;
  title: string;
  employer: string;
  coopRegistrationNumber: string;
  isVerifiedCooperative: boolean;
  location: string;
  sector: string;
  type: string;
  salary: string;
  openings: number;
  deadline: string;
  description: string;
  responsibilities: string[];
  eligibility: string[];
  requiredSkills: string[];
  matchScore: number;
  matchedSkills: { skill: string; userLevel: string; confidence: number }[];
  missingSkills: { skill: string; recommendedCourse: string }[];
  aiMatchExplanation: string;
}

export interface TraineeApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  employer: string;
  location: string;
  sector: string;
  appliedDate: string;
  status: 'applied' | 'shortlisted' | 'interview_scheduled' | 'offer_received' | 'hired';
  matchScore: number;
  interviewDetails?: {
    date: string;
    time: string;
    mode: 'In-person' | 'Virtual Video Conference';
    locationOrLink: string;
    interviewerNote: string;
  };
  offerDetails?: {
    ctc: string;
    designation: string;
    joiningDate: string;
    expiryDate: string;
  };
  employerFeedback?: {
    rating: number;
    skillsObserved: string[];
    comments: string;
  };
}

export interface SkillPassportCredential {
  id: string;
  skillName: string;
  level: 'Foundation' | 'Intermediate' | 'Advanced' | 'Proficient';
  levelTier: 1 | 2 | 3;
  confidence: number;
  verifiedHours: number;
  issuingInstitute: string;
  verifiedDate: string;
  cryptographicSignature: string;
  competencyArea: 'Technical Operations' | 'Finance & Credit' | 'Governance & Legal' | 'Marketing & Mobilization';
}

export interface PassportCertificate {
  id: string;
  title: string;
  credentialType: 'Higher Diploma' | 'Specialized Certificate' | 'Micro-Credential';
  issuer: string;
  issueDate: string;
  verificationCode: string;
  digitalSealHash: string;
  skillsCertified: string[];
}

export const CURRENT_TRAINEE_PASSPORT = {
  traineeId: 'NCCT-2026-GUJ-8492',
  fullName: 'Pooja Patel',
  photoInitial: 'PP',
  specialization: 'Cooperative Dairy Operations & Credit Management',
  apexBody: 'National Council for Cooperative Training (NCCT)',
  homeInstitute: 'RICM Anand (Gujarat)',
  overallAttendancePercentage: 97.4,
  totalPracticalHours: 360,
  verifiedMicroCredentialsCount: 8,
  officialCertificatesCount: 3,
  passportIssueDate: '2026-06-15',
  tamperProofHash: 'sha256:7f9a8c2d4e1b0983ef5621da3b109e4c8812af',
  credentials: [
    {
      id: 'cred-01',
      skillName: 'Dairy Operations & Bulk Chilling',
      level: 'Proficient' as const,
      levelTier: 3 as const,
      confidence: 96,
      verifiedHours: 120,
      issuingInstitute: 'RICM Anand',
      verifiedDate: '2026-06-10',
      cryptographicSignature: '0x9482fe...c218',
      competencyArea: 'Technical Operations' as const,
    },
    {
      id: 'cred-02',
      skillName: 'Quality Control & Milk Testing Standards',
      level: 'Advanced' as const,
      levelTier: 3 as const,
      confidence: 94,
      verifiedHours: 80,
      issuingInstitute: 'RICM Anand',
      verifiedDate: '2026-06-12',
      cryptographicSignature: '0x8821ca...914b',
      competencyArea: 'Technical Operations' as const,
    },
    {
      id: 'cred-03',
      skillName: 'Cold Chain Logistics Management',
      level: 'Advanced' as const,
      levelTier: 3 as const,
      confidence: 91,
      verifiedHours: 60,
      issuingInstitute: 'NCCT Cold Storage Logistics Board',
      verifiedDate: '2026-07-02',
      cryptographicSignature: '0x7109be...421c',
      competencyArea: 'Technical Operations' as const,
    },
    {
      id: 'cred-04',
      skillName: 'Cooperative Governance & Principles',
      level: 'Intermediate' as const,
      levelTier: 2 as const,
      confidence: 88,
      verifiedHours: 40,
      issuingInstitute: 'VAMNICOM Pune',
      verifiedDate: '2026-05-18',
      cryptographicSignature: '0x6612df...aa81',
      competencyArea: 'Governance & Legal' as const,
    },
    {
      id: 'cred-05',
      skillName: 'PACS ERP Software & Daily Accounting',
      level: 'Intermediate' as const,
      levelTier: 2 as const,
      confidence: 82,
      verifiedHours: 35,
      issuingInstitute: 'NABARD / RICM Anand Wing',
      verifiedDate: '2026-05-24',
      cryptographicSignature: '0x5501ae...bb74',
      competencyArea: 'Finance & Credit' as const,
    },
    {
      id: 'cred-06',
      skillName: 'Credit Appraisal & KCC Monitoring',
      level: 'Intermediate' as const,
      levelTier: 2 as const,
      confidence: 80,
      verifiedHours: 30,
      issuingInstitute: 'Gujarat State Co-op Bank Wing',
      verifiedDate: '2026-05-30',
      cryptographicSignature: '0x4491de...cc62',
      competencyArea: 'Finance & Credit' as const,
    },
    {
      id: 'cred-07',
      skillName: 'Rural Member Relations & Producer Mobilization',
      level: 'Foundation' as const,
      levelTier: 1 as const,
      confidence: 78,
      verifiedHours: 25,
      issuingInstitute: 'RICM Anand Extension Wing',
      verifiedDate: '2026-04-14',
      cryptographicSignature: '0x3380ce...dd51',
      competencyArea: 'Marketing & Mobilization' as const,
    },
    {
      id: 'cred-08',
      skillName: 'Digital Payments & POS for Milk Societies',
      level: 'Foundation' as const,
      levelTier: 1 as const,
      confidence: 76,
      verifiedHours: 20,
      issuingInstitute: 'RICM Anand Tech Center',
      verifiedDate: '2026-04-20',
      cryptographicSignature: '0x2279be...ee40',
      competencyArea: 'Finance & Credit' as const,
    },
  ],
  certificates: [
    {
      id: 'cert-01',
      title: 'Higher Diploma in Cooperative Dairy Operations',
      credentialType: 'Higher Diploma' as const,
      issuer: 'Regional Institute of Cooperative Management, Anand',
      issueDate: '15 June 2026',
      verificationCode: 'NCCT-HDCDO-2026-0914',
      digitalSealHash: '0x8f2a...390e',
      skillsCertified: ['Dairy Operations', 'Quality Control', 'Cold Chain Management'],
    },
    {
      id: 'cert-02',
      title: 'Micro-Credential in Milk Quality Assurance & Cold Chain Logistics',
      credentialType: 'Micro-Credential' as const,
      issuer: 'National Council for Cooperative Training (NCCT)',
      issueDate: '10 August 2026',
      verificationCode: 'NCCT-MC-MQACC-8821',
      digitalSealHash: '0x4e1b...984a',
      skillsCertified: ['Bacteriological Milk Testing', 'BMC Monitoring'],
    },
    {
      id: 'cert-03',
      title: 'PACS Computerization & Governance Standard',
      credentialType: 'Specialized Certificate' as const,
      issuer: 'Vaikunth Mehta National Institute (VAMNICOM)',
      issueDate: '20 April 2026',
      verificationCode: 'VAMN-PACS-2026-4401',
      digitalSealHash: '0x12dc...671f',
      skillsCertified: ['PACS Accounting', 'Statutory Compliance'],
    },
  ],
};

export const CAREER_JOBS_CATALOG: CareerJob[] = [
  {
    id: 'job-dairy-supervisor-anand',
    title: 'Dairy Procurement Supervisor',
    employer: 'Amul Dairy Cooperative Union',
    coopRegistrationNumber: 'MSCS/CR/84/1998',
    isVerifiedCooperative: true,
    location: 'Anand, Gujarat',
    sector: 'Dairy',
    type: 'Full-time',
    salary: '₹4,50,000 - ₹6,00,000 / year',
    openings: 5,
    deadline: '2026-10-31',
    description:
      'Oversee primary milk collection across 28 village cooperative societies, inspect Bulk Milk Cooling units (BMCs), verify milk fat and SNF testing protocols, and coordinate insulated tanker dispatch to the central processing plant.',
    responsibilities: [
      'Maintain milk collection schedules and quality adherence across 28 primary cooperative societies.',
      'Calibrate ultrasonic milk analyzers and automated milk collection units (AMCUs).',
      'Manage temperature records for bulk chilling units to preserve cold chain integrity.',
      'Coordinate transparent weekly milk billing and direct member payment disbursement.',
    ],
    eligibility: [
      'Graduate from NCCT Regional Institute of Cooperative Management (RICM) or recognized dairy institute.',
      'Verified Micro-credential in Dairy Operations and Cold Chain Management.',
      'Proficiency in Gujarati & Hindi for farmer member engagement.',
    ],
    requiredSkills: [
      'Dairy Operations',
      'Quality Control & Milk Testing',
      'Cold Chain Management',
      'Member Relations & Mobilization',
    ],
    matchScore: 95,
    matchedSkills: [
      { skill: 'Dairy Operations & Bulk Chilling', userLevel: 'Proficient (Tier 3)', confidence: 96 },
      { skill: 'Quality Control & Milk Testing', userLevel: 'Advanced (Tier 3)', confidence: 94 },
      { skill: 'Cold Chain Logistics Management', userLevel: 'Advanced (Tier 3)', confidence: 91 },
      { skill: 'Rural Member Relations', userLevel: 'Foundation (Tier 1)', confidence: 78 },
    ],
    missingSkills: [],
    aiMatchExplanation:
      'Exceptional 95% alignment. Your verified credentials from RICM Anand directly fulfill all primary core requirements, including automated BMC handling and chilling protocols.',
  },
  {
    id: 'job-cdo-ncdc',
    title: 'Cooperative Development Officer',
    employer: 'National Cooperative Development Corporation (NCDC)',
    coopRegistrationNumber: 'NCDC-ACT-1962',
    isVerifiedCooperative: true,
    location: 'New Delhi / Regional Office',
    sector: 'Cooperative Management',
    type: 'Full-time',
    salary: '₹5,50,000 - ₹7,00,000 / year',
    openings: 3,
    deadline: '2026-11-15',
    description:
      'Facilitate cooperative sector planning, evaluate financial assistance proposals from multi-state societies, conduct field monitoring of subsidized cold chains, and drive PACS computerization.',
    responsibilities: [
      'Evaluate loan proposals for cold chain and food processing cooperatives.',
      'Liaise with state cooperative departments and registrar offices.',
      'Conduct institutional capacity building workshops for primary societies.',
    ],
    eligibility: [
      'Higher Diploma or PG Diploma in Cooperative Management from NCCT / VAMNICOM.',
      'Strong analytical capabilities in rural cooperative balance sheets.',
    ],
    requiredSkills: [
      'Cooperative Management',
      'Rural Development',
      'Financial Management',
      'Cooperative Law & Statutory Audit',
    ],
    matchScore: 84,
    matchedSkills: [
      { skill: 'Cooperative Governance & Principles', userLevel: 'Intermediate (Tier 2)', confidence: 88 },
      { skill: 'PACS ERP & Accounting', userLevel: 'Intermediate (Tier 2)', confidence: 82 },
      { skill: 'Rural Member Relations', userLevel: 'Foundation (Tier 1)', confidence: 78 },
    ],
    missingSkills: [
      {
        skill: 'Cooperative Law & Statutory Audit',
        recommendedCourse: 'Advanced Cooperative Law & Audit Masterclass (4 weeks at VAMNICOM)',
      },
    ],
    aiMatchExplanation:
      'Strong 84% fit. You hold verified foundation in Cooperative Governance; completing the Cooperative Law module will elevate your score to 95%.',
  },
  {
    id: 'job-credit-officer-pune',
    title: 'Credit Officer - Cooperative Banking',
    employer: 'Maharashtra State Cooperative Bank',
    coopRegistrationNumber: 'MSCS/MH/1911/BANK',
    isVerifiedCooperative: true,
    location: 'Pune, Maharashtra',
    sector: 'Credit & Banking',
    type: 'Full-time',
    salary: '₹3,80,000 - ₹5,20,000 / year',
    openings: 8,
    deadline: '2026-10-25',
    description:
      'Appraise agricultural credit lines, Kisan Credit Cards (KCC), evaluate district central cooperative bank (DCCB) refinance, and inspect cooperative borrower assets.',
    responsibilities: [
      'Process seasonal crop loan applications and monitor repayment schedules.',
      'Inspect rural credit society books and verify audit compliance.',
      'Assist in recovery drives and NPA mitigation campaigns.',
    ],
    eligibility: [
      'Diploma in Cooperative Banking & Finance from NCCT institute.',
      'Demonstrated expertise in PACS ERP accounting.',
    ],
    requiredSkills: [
      'Credit Appraisal & KCC Monitoring',
      'PACS ERP Software & Daily Accounting',
      'Statutory Cooperative Audit',
    ],
    matchScore: 88,
    matchedSkills: [
      { skill: 'PACS ERP Software & Daily Accounting', userLevel: 'Intermediate (Tier 2)', confidence: 82 },
      { skill: 'Credit Appraisal & KCC Monitoring', userLevel: 'Intermediate (Tier 2)', confidence: 80 },
    ],
    missingSkills: [
      {
        skill: 'Statutory Cooperative Audit',
        recommendedCourse: 'Auditing Standards for Cooperative Banks (3 weeks at VAMNICOM)',
      },
    ],
    aiMatchExplanation:
      'High 88% readiness. Your NABARD-accredited PACS ERP certificate provides immediate operational readiness for district branch operations.',
  },
];

export const MY_APPLICATIONS_LIST: TraineeApplication[] = [
  {
    id: 'app-pooja-01',
    jobId: 'job-dairy-supervisor-anand',
    jobTitle: 'Dairy Procurement Supervisor',
    employer: 'Amul Dairy Cooperative Union',
    location: 'Anand, Gujarat',
    sector: 'Dairy',
    appliedDate: '2026-09-24',
    status: 'shortlisted',
    matchScore: 95,
    interviewDetails: {
      date: '2026-10-05',
      time: '10:30 AM',
      mode: 'In-person',
      locationOrLink: 'Amul Dairy Head Office, Amul Dairy Road, Anand 388001',
      interviewerNote: 'Carry original NCCT Higher Diploma & Skill Passport QR proof.',
    },
    employerFeedback: {
      rating: 5,
      skillsObserved: ['Dairy Operations', 'Cold Chain', 'Quality Testing'],
      comments: 'Top scorer from RICM Anand 2026 batch. Practical test passed with distinction.',
    },
  },
  {
    id: 'app-pooja-02',
    jobId: 'job-cdo-ncdc',
    jobTitle: 'Cooperative Development Officer',
    employer: 'National Cooperative Development Corporation (NCDC)',
    location: 'New Delhi / Regional Office',
    sector: 'Cooperative Management',
    appliedDate: '2026-09-20',
    status: 'applied',
    matchScore: 84,
  },
  {
    id: 'app-pooja-03',
    jobId: 'job-credit-officer-pune',
    jobTitle: 'Credit Officer - Cooperative Banking',
    employer: 'Maharashtra State Cooperative Bank',
    location: 'Pune, Maharashtra',
    sector: 'Credit & Banking',
    appliedDate: '2026-09-15',
    status: 'interview_scheduled',
    matchScore: 88,
    interviewDetails: {
      date: '2026-10-08',
      time: '02:00 PM',
      mode: 'Virtual Video Conference',
      locationOrLink: 'https://meet.coopsetu.gov.in/mscb-interview-pooja',
      interviewerNote: 'Technical appraisal viva on PACS computerization and NPA risk controls.',
    },
  },
  {
    id: 'app-pooja-04',
    jobId: 'job-sugar-chemist-kolhapur',
    jobTitle: 'Cooperative Operations Associate',
    employer: 'Karnataka Milk Federation (KMF Nandini)',
    location: 'Bengaluru, Karnataka',
    sector: 'Dairy',
    appliedDate: '2026-09-10',
    status: 'offer_received',
    matchScore: 92,
    offerDetails: {
      ctc: '₹5,20,000 / year',
      designation: 'Assistant Manager - Dairy Logistics',
      joiningDate: '15 November 2026',
      expiryDate: '10 October 2026',
    },
    employerFeedback: {
      rating: 5,
      skillsObserved: ['Chilling Center Logistics', 'Milk Testing'],
      comments: 'Offer extended based on outstanding Skill Passport credentials.',
    },
  },
];
