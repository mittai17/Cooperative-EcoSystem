export interface ProgrammeModule {
  id: string;
  sequence_order: number;
  title: string;
  category: string;
  hours: number;
  instructor: string;
  is_mandatory: boolean;
  description: string;
  skills: string[];
}

export interface ProgrammeDetailData {
  id: string;
  title: string;
  sector: string;
  level: 'Foundational' | 'Intermediate' | 'Advanced' | 'Executive';
  mode: 'Residential On-Campus' | 'Hybrid' | 'Virtual';
  duration_weeks: number;
  duration_hours: number;
  seats_total: number;
  seats_filled: number;
  venue: string;
  institution_name: string;
  start_date: string;
  end_date: string;
  application_deadline: string;
  fees: string;
  description: string;
  objectives: string[];
  eligibility: string[];
  target_audience: string[];
  modules: ProgrammeModule[];
}

export interface NominationRecord {
  id: string;
  programme_id: string;
  programme_title: string;
  institution_name: string;
  trainee_id: string;
  trainee_name: string;
  trainee_email: string;
  trainee_phone: string;
  designation: string;
  nomination_type: 'self' | 'sponsoring_org';
  society_name?: string;
  society_registration_no?: string;
  sponsor_officer_name?: string;
  sponsor_officer_designation?: string;
  sponsor_officer_email?: string;
  sponsor_officer_phone?: string;
  state?: string;
  district?: string;
  justification: string;
  status: 'draft' | 'submitted' | 'society_approved' | 'under_review' | 'approved' | 'waitlisted' | 'rejected' | 'withdrawn';
  batch_id?: string;
  batch_name?: string;
  start_date?: string;
  end_date?: string;
  submitted_at: string;
  reviewed_at?: string;
  decision_note?: string;
  room_allocated?: boolean;
}

export const MOCK_PROGRAMMES: Record<string, ProgrammeDetailData> = {
  'p-cmf-01': {
    id: 'p-cmf-01',
    title: 'Cooperative Management & Governance Excellence',
    sector: 'Multi-State & Primary Cooperatives',
    level: 'Advanced',
    mode: 'Residential On-Campus',
    duration_weeks: 4,
    duration_hours: 120,
    seats_total: 45,
    seats_filled: 38,
    venue: 'Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM), Pune',
    institution_name: 'VAMNICOM Pune',
    start_date: '2026-10-15',
    end_date: '2026-11-12',
    application_deadline: '2026-10-05',
    fees: 'Sponsored by Ministry of Cooperation (Govt of India)',
    description:
      'A flagship national executive programme designed for cooperative society executives, secretaries, and board members to master modern governance, financial statutory compliance, leadership ethics, and sustainable business modeling for rural cooperatives.',
    objectives: [
      'Master democratic governance principles and statutory legal framework under the Multi-State Cooperative Societies Act.',
      'Implement robust internal audit mechanisms, NPA management, and prudent asset-liability management.',
      'Transition traditional operations into paperless digital workflows using standard Core Banking and MIS systems.',
      'Formulate high-yield business diversification plans into rural warehousing, solar microgrids, and input supply.',
    ],
    eligibility: [
      "Bachelor's degree in any discipline from a recognized University.",
      'Minimum 2 years of active service in a registered Cooperative Society / Federation / DCCB.',
      'Deputation endorsement or Letter of Recommendation from sponsoring cooperative body.',
      'Age between 21 and 58 years at the time of nomination.',
    ],
    target_audience: [
      'Chief Executive Officers & General Managers of PACS',
      'Elected Board of Directors & Managing Committee Members',
      'Junior and Senior Cooperative Inspectors (State Cooperation Departments)',
      'Managers of District Central Cooperative Banks (DCCBs)',
    ],
    modules: [
      {
        id: 'mod-1',
        sequence_order: 1,
        title: 'Cooperative Principles, By-Laws & Legal Framework',
        category: 'Governance',
        hours: 24,
        instructor: 'Dr. Rameshwar K. Joshi (Dean of Cooperatives)',
        is_mandatory: true,
        description:
          'Deep dive into the 7 Rochdale principles, modern cooperative jurisprudence, state cooperative acts, and constitutional 97th amendment provisions.',
        skills: ['Cooperative Law', 'Statutory Compliance', 'By-law Drafting', 'Board Resolution Protocol'],
      },
      {
        id: 'mod-2',
        sequence_order: 2,
        title: 'Financial Management, Accounting & Statutory Audit',
        category: 'Finance & Banking',
        hours: 32,
        instructor: 'Prof. Ananth Patil (Chartered Accountant & Co-op Auditor)',
        is_mandatory: true,
        description:
          'Standardised double-entry bookkeeping, balance sheet finalisation, reserve fund creation, dividend calculation, and NABARD prudential norms.',
        skills: ['Financial Auditing', 'NPA Recovery', 'NABARD Guidelines', 'Balance Sheet Analysis'],
      },
      {
        id: 'mod-3',
        sequence_order: 3,
        title: 'Digital PACS Transformation & Core Banking Solutions',
        category: 'Technology',
        hours: 28,
        instructor: 'Er. Meenakshi Sundaram (Fintech Lead)',
        is_mandatory: true,
        description:
          'Hands-on computer terminal training on National PACS Digitisation software, e-KYC integration, mobile banking, and cybersecurity protocols.',
        skills: ['Core Banking Solutions (CBS)', 'Micro-ATMs', 'Cybersecurity Basics', 'Data Governance'],
      },
      {
        id: 'mod-4',
        sequence_order: 4,
        title: 'Credit Appraisal, Microfinance & Risk Management',
        category: 'Credit & Risk',
        hours: 20,
        instructor: 'Shri Vinod Deshmukh (Former CGM, NABARD)',
        is_mandatory: true,
        description:
          'Agricultural credit scoring, Kisan Credit Card (KCC) underwriting, collateral evaluation, and recovery proceedings under Section 101.',
        skills: ['Credit Assessment', 'KCC Scheme', 'Risk Mitigation', 'Loan Recovery'],
      },
      {
        id: 'mod-5',
        sequence_order: 5,
        title: 'Field Study & Live Cooperative Immersion',
        category: 'Practical Field',
        hours: 16,
        instructor: 'Smt. Vandana Hegde (Field Director)',
        is_mandatory: false,
        description:
          '2-day practical field exposure visit to exemplary Amul Dairy societies, Warana sugar cooperative complex, and urban cooperative credit banks.',
        skills: ['Field Immersion', 'Best Practice Benchmarking', 'Stakeholder Engagement'],
      },
    ],
  },
  'p-dairy-02': {
    id: 'p-dairy-02',
    title: 'Dairy Cooperative Enterprise & Cold Chain Logistics',
    sector: 'Dairy & Animal Husbandry',
    level: 'Intermediate',
    mode: 'Residential On-Campus',
    duration_weeks: 3,
    duration_hours: 90,
    seats_total: 40,
    seats_filled: 31,
    venue: 'Institute of Cooperative Management (ICM), Anand, Gujarat',
    institution_name: 'ICM Anand',
    start_date: '2026-11-01',
    end_date: '2026-11-21',
    application_deadline: '2026-10-20',
    fees: 'Funded under National Dairy Development Plan',
    description:
      'Comprehensive technical and operational training for dairy cooperative supervisors, village collection center heads, and milk union logistics coordinators focusing on testing, cold chain preservation, and fair member payouts.',
    objectives: [
      'Master automated fat and SNF testing and automated milk collection units (AMCU).',
      'Optimize bulk milk cooler (BMC) logistics, tanker routing, and chilled supply chains.',
      'Ensure veterinary extension outreach, cattle insurance, and clean milk production protocols.',
    ],
    eligibility: [
      '10+2 with Diploma/Degree or minimum 1 year working with village dairy cooperative.',
      'Nomination by District Milk Union or State Dairy Federation.',
    ],
    target_audience: [
      'Village Dairy Cooperative Society Secretaries',
      'Bulk Milk Chilling Center In-charges',
      'Procurement Officers & Route Supervisors',
    ],
    modules: [
      {
        id: 'mod-d1',
        sequence_order: 1,
        title: 'Milk Quality Testing & AMCU Operations',
        category: 'Quality & Testing',
        hours: 30,
        instructor: 'Dr. Ketan Barot (NDDB Specialist)',
        is_mandatory: true,
        description: 'Electronic lactometer calibration, adulteration detection, and direct farmer payout calculation.',
        skills: ['Fat & SNF Testing', 'AMCU Calibration', 'Quality Control'],
      },
      {
        id: 'mod-d2',
        sequence_order: 2,
        title: 'Cold Chain Management & Route Optimisation',
        category: 'Logistics',
        hours: 30,
        instructor: 'Prof. S. R. Patel',
        is_mandatory: true,
        description: 'Chilling temperature monitoring, diesel genset backups, and route GPS logistics.',
        skills: ['Cold Chain Logistics', 'Fleet Scheduling', 'Energy Efficiency'],
      },
      {
        id: 'mod-d3',
        sequence_order: 3,
        title: 'Cooperative Governance & Member Welfare Schemes',
        category: 'Governance',
        hours: 30,
        instructor: 'Smt. Geeta Nayak',
        is_mandatory: true,
        description: 'Bonus distribution, cattle feed subsidy distribution, and women self-help group dairy clusters.',
        skills: ['Member Relations', 'Bonus Calculation', 'SHG Integration'],
      },
    ],
  },
  'p-pacs-03': {
    id: 'p-pacs-03',
    title: 'PACS Computerisation & Statutory Compliance Certification',
    sector: 'Banking & Credit',
    level: 'Foundational',
    mode: 'Hybrid',
    duration_weeks: 2,
    duration_hours: 60,
    seats_total: 50,
    seats_filled: 48,
    venue: 'State Institute of Rural Development & Panchayati Raj (SIRDPR), Bhopal',
    institution_name: 'RICM Bhopal',
    start_date: '2026-10-25',
    end_date: '2026-11-08',
    application_deadline: '2026-10-14',
    fees: 'Fully Subsidized by State Cooperation Dept',
    description:
      'Fast-track practical training on standard ERP software rollout for primary agricultural credit societies (PACS), audit data migration, and statutory reporting to DCCBs.',
    objectives: [
      'Transition manual ledgers to Cloud ERP.',
      'Generate monthly trial balance and statutory returns on portal.',
      'Manage member share capital and dividend registers.',
    ],
    eligibility: ['Computer literacy basic certificate and PACS employment.'],
    target_audience: ['PACS Accountants', 'Computer Operators', 'Assistant Secretaries'],
    modules: [
      {
        id: 'mod-p1',
        sequence_order: 1,
        title: 'PACS ERP Architecture & Ledger Entry',
        category: 'Software Training',
        hours: 30,
        instructor: 'Er. Alok Verma',
        is_mandatory: true,
        description: 'Day-end routines, cash book, general ledger, and daybook verification.',
        skills: ['PACS ERP', 'Double Entry Ledger', 'Trial Balance'],
      },
      {
        id: 'mod-p2',
        sequence_order: 2,
        title: 'Statutory Reports & Regulatory Filings',
        category: 'Compliance',
        hours: 30,
        instructor: 'Shri R. P. Tiwari',
        is_mandatory: true,
        description: 'RCS statutory filing, NABARD reporting templates, and audit queries.',
        skills: ['RCS Compliance', 'Regulatory Filings', 'Audit Preparation'],
      },
    ],
  },
};

export const MOCK_USER_NOMINATIONS: NominationRecord[] = [
  {
    id: 'nom-9821',
    programme_id: 'p-cmf-01',
    programme_title: 'Cooperative Management & Governance Excellence',
    institution_name: 'VAMNICOM Pune',
    trainee_id: 'usr-trainee-01',
    trainee_name: 'Santosh Kumar Shinde',
    trainee_email: 'santosh.shinde@coopnet.in',
    trainee_phone: '+91 98220 14820',
    designation: 'Assistant Secretary',
    nomination_type: 'sponsoring_org',
    society_name: 'Kisan Seva Sahakari Mandali Maryadit',
    society_registration_no: 'MAH/PUN/COOP/2012/4412',
    sponsor_officer_name: 'Balasaheb Thorat',
    sponsor_officer_designation: 'Chairman / Chief Executive',
    sponsor_officer_email: 'chairman@kisanseva-coop.org',
    sponsor_officer_phone: '+91 98221 55667',
    state: 'Maharashtra',
    district: 'Pune',
    justification:
      'Nominated to lead the PACS digital transition under the National Computerisation Project and enhance recovery mechanisms of agricultural loans.',
    status: 'approved',
    batch_id: 'batch-vam-26-01',
    batch_name: 'Batch 1 - Oct 2026',
    start_date: '2026-10-15',
    end_date: '2026-11-12',
    submitted_at: '2026-09-12T10:30:00Z',
    reviewed_at: '2026-09-18T14:20:00Z',
    decision_note:
      'Candidate credentials thoroughly verified. Society registration is valid and in Good Standing (Class A). Assigned to Batch 1. Hostel accommodation sanctioned in Block B.',
    room_allocated: true,
  },
  {
    id: 'nom-8432',
    programme_id: 'p-dairy-02',
    programme_title: 'Dairy Cooperative Enterprise & Cold Chain Logistics',
    institution_name: 'ICM Anand',
    trainee_id: 'usr-trainee-01',
    trainee_name: 'Santosh Kumar Shinde',
    trainee_email: 'santosh.shinde@coopnet.in',
    trainee_phone: '+91 98220 14820',
    designation: 'Field Operations In-charge',
    nomination_type: 'sponsoring_org',
    society_name: 'Sahyadri Dudh Utpadak Sahakari Sanstha',
    society_registration_no: 'MAH/SAN/DAIRY/2018/109',
    sponsor_officer_name: 'Govind Rao Deshmukh',
    sponsor_officer_designation: 'Managing Director',
    state: 'Maharashtra',
    district: 'Satara',
    justification:
      'Nominated to improve milk quality parameters and establish bulk milk chilling logistics in Satara district.',
    status: 'under_review',
    submitted_at: '2026-09-22T16:45:00Z',
    decision_note:
      'Application under review by Academic Admissions Sub-committee. Verification of dairy union affiliation in progress.',
    room_allocated: false,
  },
  {
    id: 'nom-7104',
    programme_id: 'p-pacs-03',
    programme_title: 'PACS Computerisation & Statutory Compliance Certification',
    institution_name: 'RICM Bhopal',
    trainee_id: 'usr-trainee-01',
    trainee_name: 'Santosh Kumar Shinde',
    trainee_email: 'santosh.shinde@coopnet.in',
    trainee_phone: '+91 98220 14820',
    designation: 'Assistant Secretary',
    nomination_type: 'self',
    justification:
      'Self-nominated to obtain national certification in Cloud PACS ERP and double-entry automated accounts.',
    status: 'submitted',
    submitted_at: '2026-09-26T09:15:00Z',
    decision_note: 'Awaiting initial document scrutiny by registrar desk.',
    room_allocated: false,
  },
];
