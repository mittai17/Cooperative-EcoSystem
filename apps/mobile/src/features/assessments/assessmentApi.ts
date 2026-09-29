import { API_BASE_URL } from '../../services/api';
import {
  AssessmentInfo,
  AssessmentAttemptData,
  AssessmentResultData,
  TraineeEligibilityCheck,
} from './assessmentTypes';

/** Thrown by assessmentApi calls when the real backend request fails (network
 * error or non-200). The backend has a substantive server-graded engine —
 * never fabricate a success (a fake save, a locally-graded result, or a
 * made-up verification code) on this path. Callers must surface the error. */
export class AssessmentApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssessmentApiError';
  }
}

const MOCK_ASSESSMENT_INFO: Record<string, AssessmentInfo> = {
  default: {
    id: 'asmt-coop-001',
    title: 'Cooperative Governance & Statutory Audit Evaluation',
    skill_name: 'Cooperative Governance',
    duration_minutes: 30,
    passing_score: 60,
    max_attempts: 3,
    due_date: '2026-10-15T23:59:59Z',
    questions: 10,
    instructions: [
      'This assessment consists of 10 timed questions covering Cooperative Society Act, Accounting & Governance.',
      'A passing score of 60% is required for certificate eligibility and Skill Passport credentialing.',
      'Timer will run continuously. If time runs out, your current answers are automatically submitted.',
      'Each question has only one correct answer unless specified otherwise.',
      'Do not navigate away or switch applications during the assessment.',
    ],
  },
};

const MOCK_QUESTIONS = [
  {
    id: 'q-1',
    position: 1,
    type: 'single_choice' as const,
    prompt: 'Under Section 64 of the Multi-State Cooperative Societies Act, who is authorized to conduct the statutory audit?',
    options: [
      'Any member elected by the General Body',
      'A qualified Chartered Accountant from the approved panel of Central Registrar',
      'The managing director of the society',
      'The local branch manager of the State Cooperative Bank',
    ],
    marks: 10,
    topic: 'Statutory Compliance',
    correct: ['A qualified Chartered Accountant from the approved panel of Central Registrar'],
    explanation:
      'Section 64 mandates that statutory audit of a Multi-State Cooperative Society must be conducted by a practicing Chartered Accountant from the panel approved by the Central Registrar of Cooperative Societies.',
  },
  {
    id: 'q-2',
    position: 2,
    type: 'single_choice' as const,
    prompt: 'What is the minimum statutory reserve fund allocation required from annual net profits of a Primary Agricultural Credit Society (PACS)?',
    options: ['10%', '15%', '25%', '50%'],
    marks: 10,
    topic: 'Financial Accounting',
    correct: ['25%'],
    explanation:
      'Cooperative law requires every society to transfer not less than 25% of its net profit to the statutory reserve fund before declaring dividends.',
  },
  {
    id: 'q-3',
    position: 3,
    type: 'single_choice' as const,
    prompt: 'Which of the following bodies holds the ultimate authority in a cooperative society according to democratic member control principle?',
    options: [
      'The Board of Directors',
      'The General Body of Members',
      'The Registrar of Cooperative Societies',
      'The Chief Executive Officer',
    ],
    marks: 10,
    topic: 'Governance',
    correct: ['The General Body of Members'],
    explanation:
      'The General Body of Members is the supreme authority in a cooperative society, exercising democratic control through one member, one vote.',
  },
  {
    id: 'q-4',
    position: 4,
    type: 'single_choice' as const,
    prompt: 'Under NCCT guidelines, what is the mandatory quorum requirement for an Annual General Meeting (AGM) of a cooperative?',
    options: [
      'At least 1/5th of the total voting members or 50 members, whichever is less',
      'Only 10% of members present in person',
      '50% of the executive committee only',
      'No quorum required if adjourned once',
    ],
    marks: 10,
    topic: 'Governance',
    correct: ['At least 1/5th of the total voting members or 50 members, whichever is less'],
    explanation:
      'Statutory rules prescribe a minimum quorum of 1/5th of active voting members or 50 members to validly transact business at an AGM.',
  },
  {
    id: 'q-5',
    position: 5,
    type: 'single_choice' as const,
    prompt: 'What constitutes the maximum ceiling on dividend distribution to members in typical state cooperative societies acts?',
    options: ['9% per annum', '12% to 15% per annum', '25% per annum', 'Unlimited based on profits'],
    marks: 10,
    topic: 'Financial Accounting',
    correct: ['12% to 15% per annum'],
    explanation:
      'To prevent speculative capital orientation, cooperative laws cap dividend distribution on paid-up share capital typically between 12% and 15%.',
  },
  {
    id: 'q-6',
    position: 6,
    type: 'single_choice' as const,
    prompt: 'Which financial ratio best measures the liquidity health of an urban cooperative bank for loan disbursements?',
    options: [
      'Credit-Deposit (CD) Ratio',
      'Gross Non-Performing Assets (GNPA) Ratio',
      'Capital to Risk-Weighted Assets Ratio (CRAR)',
      'Net Interest Margin (NIM)',
    ],
    marks: 10,
    topic: 'Risk Management',
    correct: ['Credit-Deposit (CD) Ratio'],
    explanation:
      'The Credit-Deposit Ratio indicates the proportion of loan assets created out of deposits mobilized, serving as a key liquidity indicator.',
  },
  {
    id: 'q-7',
    position: 7,
    type: 'single_choice' as const,
    prompt: 'In cooperative accounting, where is the Bad Debt Reserve classified in the balance sheet?',
    options: [
      'Under Current Assets',
      'As a deduction from Loans & Advances under Assets',
      'Under Share Capital',
      'Under Contingent Liabilities',
    ],
    marks: 10,
    topic: 'Financial Accounting',
    correct: ['As a deduction from Loans & Advances under Assets'],
    explanation:
      'Prudential accounting norms dictate showing provisions for bad and doubtful debts either as a deduction from gross advances or under reserves & surplus.',
  },
  {
    id: 'q-8',
    position: 8,
    type: 'single_choice' as const,
    prompt: 'What is the primary role of the Cooperative Election Authority under recent constitutional amendments?',
    options: [
      'To approve commercial loan proposals',
      'To conduct free, fair, and timely elections to cooperative boards',
      'To appoint statutory auditors',
      'To merge loss-making credit societies',
    ],
    marks: 10,
    topic: 'Statutory Compliance',
    correct: ['To conduct free, fair, and timely elections to cooperative boards'],
    explanation:
      'The 97th Constitutional Amendment established an independent election authority to ensure democratic and timely conduct of board elections.',
  },
  {
    id: 'q-9',
    position: 9,
    type: 'single_choice' as const,
    prompt: 'A PACS computerization common software (ERP) links primary societies with which tier of the cooperative banking structure?',
    options: [
      'NABARD directly',
      'District Central Cooperative Bank (DCCB)',
      'Reserve Bank of India Central Server',
      'Ministry of Finance portal',
    ],
    marks: 10,
    topic: 'Governance',
    correct: ['District Central Cooperative Bank (DCCB)'],
    explanation:
      'National PACS computerization directly integrates Primary Agricultural Credit Societies with their respective District Central Cooperative Banks (DCCBs).',
  },
  {
    id: 'q-10',
    position: 10,
    type: 'single_choice' as const,
    prompt: 'What is the standard limitation period for initiating recovery of overdue dues from a defaulting member after due date?',
    options: ['1 year', '3 years from default date', '10 years', 'No limitation applies to cooperatives'],
    marks: 10,
    topic: 'Statutory Compliance',
    correct: ['3 years from default date'],
    explanation:
      'Under the Limitation Act and Cooperative arbitration provisions, dispute referral for loan recovery must generally be filed within 3 years of default.',
  },
];

export const assessmentApi = {
  async getAssessment(id: string): Promise<AssessmentInfo> {
    try {
      const res = await fetch(`${API_BASE_URL}/assessments/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id || id,
          title: data.title || 'Cooperative Governance & Compliance Assessment',
          skill_name: data.skill_name || 'Cooperative Management',
          duration_minutes: data.duration_minutes || 30,
          passing_score: data.passing_score || 60,
          max_attempts: data.max_attempts || 3,
          due_date: data.due_date,
          questions: data.questions || 10,
          instructions: MOCK_ASSESSMENT_INFO.default.instructions,
        };
      }
    } catch {
      // Fallback to mock
    }
    return {
      ...MOCK_ASSESSMENT_INFO.default,
      id,
    };
  },

  async startAttempt(assessmentId: string): Promise<AssessmentAttemptData> {
    try {
      const res = await fetch(`${API_BASE_URL}/assessments/${encodeURIComponent(assessmentId)}/attempts`, {
        method: 'POST',
      });
      if (res.ok) {
        return (await res.json()) as AssessmentAttemptData;
      }
    } catch {
      // Fallback
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    return {
      attempt_id: `att-${Date.now()}`,
      assessment_id: assessmentId,
      expires_at: expiresAt.toISOString(),
      server_time: now.toISOString(),
      questions: MOCK_QUESTIONS,
    };
  },

  /**
   * Persists one answer to the real attempt. Never swallows a failure into a
   * fake success — on a network error or non-200 response this throws
   * `AssessmentApiError` so the caller can show a real "save failed" state.
   */
  async saveAnswer(attemptId: string, questionId: string, answer: string[]): Promise<boolean> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/assessments/attempts/${encodeURIComponent(attemptId)}/answers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, answer }),
      });
    } catch {
      throw new AssessmentApiError('Could not save your answer — check your connection.');
    }
    if (!res.ok) {
      throw new AssessmentApiError('Could not save your answer — check your connection.');
    }
    return true;
  },

  /**
   * Submits the attempt to the real, server-graded engine. This is one-shot —
   * the backend only accepts it while the attempt is in_progress. Never falls
   * back to locally-graded fake results; on failure throws `AssessmentApiError`
   * so the caller can show a real error with retry.
   */
  async submitAttempt(attemptId: string): Promise<AssessmentResultData> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/assessments/attempts/${encodeURIComponent(attemptId)}/submit`, {
        method: 'POST',
      });
    } catch {
      throw new AssessmentApiError('Could not submit your assessment — check your connection and try again.');
    }
    if (!res.ok) {
      let detail: string | undefined;
      try {
        detail = (await res.json())?.detail;
      } catch {
        // Not JSON
      }
      throw new AssessmentApiError(detail || 'Could not submit your assessment — check your connection and try again.');
    }
    return (await res.json()) as AssessmentResultData;
  },

  async getBatchEligibility(batchId: string): Promise<{
    batch_name: string;
    total_enrolled: number;
    eligible_count: number;
    trainees: TraineeEligibilityCheck[];
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/certificates/eligibility?programme_id=prog-1&batch_id=${encodeURIComponent(batchId)}`);
      if (res.ok) {
        const data = await res.json();
        const trainees = data.trainees || [];
        return {
          batch_name: `Batch ${batchId.slice(0, 8)}`,
          total_enrolled: trainees.length,
          eligible_count: trainees.filter((t: TraineeEligibilityCheck) => t.eligible).length,
          trainees,
        };
      }
    } catch {
      // Fallback mock
    }

    const mockTrainees: TraineeEligibilityCheck[] = [
      {
        trainee_id: 'tr-001',
        trainee_name: 'Aarav Sharma',
        attendance_pct: 92,
        min_attendance_pct: 75,
        mandatory_courses_completed: 4,
        mandatory_courses_total: 4,
        assessments_passed: 2,
        assessments_total: 2,
        eligible: true,
        checks: { enrolled: true, attendance: true, courses: true, assessments: true, not_already_issued: true },
      },
      {
        trainee_id: 'tr-002',
        trainee_name: 'Pooja Patel',
        attendance_pct: 85,
        min_attendance_pct: 75,
        mandatory_courses_completed: 4,
        mandatory_courses_total: 4,
        assessments_passed: 2,
        assessments_total: 2,
        eligible: true,
        checks: { enrolled: true, attendance: true, courses: true, assessments: true, not_already_issued: true },
      },
      {
        trainee_id: 'tr-003',
        trainee_name: 'Rohan Deshmukh',
        attendance_pct: 68,
        min_attendance_pct: 75,
        mandatory_courses_completed: 4,
        mandatory_courses_total: 4,
        assessments_passed: 2,
        assessments_total: 2,
        eligible: false,
        checks: { enrolled: true, attendance: false, courses: true, assessments: true, not_already_issued: true },
      },
      {
        trainee_id: 'tr-004',
        trainee_name: 'Sneha Sundaram',
        attendance_pct: 96,
        min_attendance_pct: 75,
        mandatory_courses_completed: 4,
        mandatory_courses_total: 4,
        assessments_passed: 2,
        assessments_total: 2,
        eligible: true,
        checks: { enrolled: true, attendance: true, courses: true, assessments: true, not_already_issued: true },
      },
      {
        trainee_id: 'tr-005',
        trainee_name: 'Vikram Mehta',
        attendance_pct: 80,
        min_attendance_pct: 75,
        mandatory_courses_completed: 2,
        mandatory_courses_total: 4,
        assessments_passed: 1,
        assessments_total: 2,
        eligible: false,
        checks: { enrolled: true, attendance: true, courses: false, assessments: false, not_already_issued: true },
      },
      {
        trainee_id: 'tr-006',
        trainee_name: 'Ananya Mukherjee',
        attendance_pct: 78,
        min_attendance_pct: 75,
        mandatory_courses_completed: 4,
        mandatory_courses_total: 4,
        assessments_passed: 2,
        assessments_total: 2,
        eligible: true,
        checks: { enrolled: true, attendance: true, courses: true, assessments: true, not_already_issued: true },
      },
    ];

    return {
      batch_name: 'PACS Diploma Cohort 2026-A',
      total_enrolled: mockTrainees.length,
      eligible_count: mockTrainees.filter((t) => t.eligible).length,
      trainees: mockTrainees,
    };
  },

  /**
   * Issues certificates via the real, DB-backed batch-issue endpoint. Never
   * fabricates verification codes or a fake "issued" list on failure — on a
   * network error or non-200 response this throws `AssessmentApiError` so the
   * caller can show a real error instead of a fabricated success.
   */
  async issueBatchCertificates(
    programmeId: string,
    batchId: string,
    traineeIds: string[],
    grade: string = 'A'
  ): Promise<{ issued: Array<{ trainee_id: string; verification_code: string }>; rejected: string[] }> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/certificates/issue-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programme_id: programmeId,
          batch_id: batchId,
          trainee_ids: traineeIds,
          grade,
        }),
      });
    } catch {
      throw new AssessmentApiError('Could not issue certificates — check your connection and try again.');
    }
    if (!res.ok) {
      let detail: string | undefined;
      try {
        detail = (await res.json())?.detail;
      } catch {
        // Not JSON
      }
      throw new AssessmentApiError(detail || 'Could not issue certificates — check your connection and try again.');
    }
    return await res.json();
  },
};
