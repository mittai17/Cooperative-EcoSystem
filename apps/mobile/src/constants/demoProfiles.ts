import { AuthUser } from '../types';

export interface DemoRoleConfig {
  role: string;
  name: string;
  affiliation: string;
  email: string;
  icon: string;
  color: string;
  tagline: string;
  targetTab: string;
  user: AuthUser;
}

export const DEMO_PROFILES: Record<string, DemoRoleConfig> = {
  trainee: {
    role: 'trainee',
    name: 'Ravindra Suresh Patil',
    affiliation: 'IRMA Anand',
    email: 'ravindra.patil@coopsetu.in',
    icon: 'GraduationCap',
    color: '#D8232A',
    tagline: 'Learner, Skill Passport, QR Scan, Job Apply',
    targetTab: 'TraineeTabs',
    user: {
      id: 'demo-trainee-001',
      clerkUserId: 'clerk_demo_trainee_001',
      email: 'ravindra.patil@coopsetu.in',
      fullName: 'Ravindra Suresh Patil',
      role: 'trainee',
      organisation: {
        id: 'org-irma',
        name: 'Institute of Rural Management Anand (IRMA)',
        type: 'institution',
      },
      trainee: {
        id: 'trainee-001',
        name: 'Ravindra Suresh Patil',
        email: 'ravindra.patil@coopsetu.in',
        role: 'trainee',
        enrolled_institution: 'IRMA Anand',
        programme: 'Diploma in Cooperative Management',
        avatar_initials: 'RP',
      },
    },
  },
  institution: {
    role: 'institution',
    name: 'Dr. P. K. Swaminathan',
    affiliation: 'IRMA Anand',
    email: 'pk.swaminathan@irma.ac.in',
    icon: 'Building2',
    color: '#7C3AED',
    tagline: 'Programmes, Nominations, Operations',
    targetTab: 'InstitutionTabs',
    user: {
      id: 'demo-inst-001',
      clerkUserId: 'clerk_demo_inst_001',
      email: 'pk.swaminathan@irma.ac.in',
      fullName: 'Dr. P. K. Swaminathan',
      role: 'institution',
      organisation: {
        id: 'org-irma',
        name: 'IRMA Anand',
        type: 'institution',
      },
      trainee: null,
    },
  },
  trainer: {
    role: 'trainer',
    name: 'Prof. Sunita Agarwal',
    affiliation: 'VAMNICOM Pune',
    email: 'sunita.agarwal@vamnicom.gov.in',
    icon: 'Users',
    color: '#0284C7',
    tagline: "Today's Classes, Session QR Console, Trainees",
    targetTab: 'TrainerTabs',
    user: {
      id: 'demo-trainer-001',
      clerkUserId: 'clerk_demo_trainer_001',
      email: 'sunita.agarwal@vamnicom.gov.in',
      fullName: 'Prof. Sunita Agarwal',
      role: 'trainer',
      organisation: {
        id: 'org-vamnicom',
        name: 'VAMNICOM Pune',
        type: 'institution',
      },
      trainee: null,
    },
  },
  employer: {
    role: 'employer',
    name: 'Rajesh Mehta',
    affiliation: 'Amul Dairy HR',
    email: 'rajesh.mehta@amuldairy.coop',
    icon: 'Briefcase',
    color: '#D97706',
    tagline: 'Post Jobs, Candidate Pipeline, Feedback',
    targetTab: 'EmployerTabs',
    user: {
      id: 'demo-employer-001',
      clerkUserId: 'clerk_demo_employer_001',
      email: 'rajesh.mehta@amuldairy.coop',
      fullName: 'Rajesh Mehta',
      role: 'employer',
      organisation: {
        id: 'org-amul',
        name: 'Amul Dairy HR',
        type: 'employer',
      },
      trainee: null,
    },
  },
  admin: {
    role: 'admin',
    name: 'S. K. Verma',
    affiliation: 'Directorate Delhi',
    email: 'sk.verma@ncct.gov.in',
    icon: 'Shield',
    color: '#059669',
    tagline: 'National Dashboard, Skill Demand, League Table',
    targetTab: 'AdminTabs',
    user: {
      id: 'demo-admin-001',
      clerkUserId: 'clerk_demo_admin_001',
      email: 'sk.verma@ncct.gov.in',
      fullName: 'S. K. Verma',
      role: 'admin',
      organisation: {
        id: 'org-ncct',
        name: 'National Council for Cooperative Training (Directorate Delhi)',
        type: 'admin',
      },
      trainee: null,
    },
  },
};

export const DEMO_ROLE_LIST = Object.values(DEMO_PROFILES);

export const getDemoProfileByRole = (role: string): DemoRoleConfig | undefined => {
  const normalized = role.toLowerCase().trim();
  if (normalized === 'ncct_admin') return DEMO_PROFILES.admin;
  return DEMO_PROFILES[normalized];
};
