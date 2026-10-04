/**
 * Assessment data for the trainee Assessments Hub.
 *
 * The hub used to call `GET /api/v1/assessments/my` on a backend that is not part
 * of the demo, which returned 401 and left the page on an error path. Everything
 * the hub needs is resolved from here instead: a summary per assessment, a
 * question bank per assessment with the answer key, and a deterministic grader.
 *
 * Due dates are relative to the moment the page loads so the Upcoming and Missed
 * tabs always hold both sets of rows without the fixtures going stale.
 */

export type AssessmentStatus = "upcoming" | "in_progress" | "completed";

export type QuestionType = "mcq_single" | "mcq_multi" | "true_false";

export interface AssessmentSummary {
  id: string;
  title: string;
  programme: string;
  skillFocus: string;
  duration_minutes: number;
  passing_score: number;
  total_questions: number;
  due_date: string | null;
  status: AssessmentStatus;
  open_attempt_id: string | null;
  best_score: number | null;
  attempts_left: number;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  options: QuestionOption[];
  marks: number;
  topic: string;
  /** Answer key. Used by the grader only; never rendered. */
  correct: string[] | boolean;
}

export interface GradedAttempt {
  score: number;
  passed: boolean;
  correctCount: number;
  questionCount: number;
}

type DraftAssessment = Omit<AssessmentSummary, "due_date"> & {
  dueInDays: number | null;
};

const DRAFT_ASSESSMENTS: DraftAssessment[] = [
  {
    id: "assess-coop-law-01",
    title: "Cooperative Law & Principles Evaluation",
    programme: "Cooperative Management Fundamentals",
    skillFocus: "Cooperative Law & Principles",
    duration_minutes: 20,
    passing_score: 70,
    total_questions: 4,
    dueInDays: 5,
    status: "upcoming",
    open_attempt_id: null,
    best_score: null,
    attempts_left: 3,
  },
  {
    id: "assess-dairy-ops-02",
    title: "Dairy Cold Chain & Milk Testing Evaluation",
    programme: "Dairy Cooperative Operations",
    skillFocus: "Dairy Operations",
    duration_minutes: 15,
    passing_score: 65,
    total_questions: 4,
    dueInDays: 7,
    status: "upcoming",
    open_attempt_id: null,
    best_score: null,
    attempts_left: 2,
  },
  {
    id: "assess-pacs-daybook-03",
    title: "PACS Day-Book & Cash Scroll Test",
    programme: "Cooperative Management Fundamentals",
    skillFocus: "Bookkeeping",
    duration_minutes: 30,
    passing_score: 70,
    total_questions: 4,
    dueInDays: 12,
    status: "upcoming",
    open_attempt_id: null,
    best_score: null,
    attempts_left: 3,
  },
  {
    id: "assess-fssai-04",
    title: "Milk Handling, Hygiene & FSSAI Basics",
    programme: "Dairy Cooperative Operations",
    skillFocus: "Quality Testing",
    duration_minutes: 15,
    passing_score: 60,
    total_questions: 3,
    dueInDays: 9,
    status: "upcoming",
    open_attempt_id: null,
    best_score: null,
    attempts_left: 3,
  },
  {
    id: "assess-member-relations-05",
    title: "Member Relations & Conflict Resolution Simulation",
    programme: "Cooperative Management Fundamentals",
    skillFocus: "Leadership & Facilitation",
    duration_minutes: 30,
    passing_score: 70,
    total_questions: 3,
    dueInDays: 3,
    status: "in_progress",
    open_attempt_id: "att-open-member-relations-05",
    best_score: null,
    attempts_left: 2,
  },
  {
    id: "assess-statutory-audit-06",
    title: "Statutory Cooperative Audit & Inspection Quiz",
    programme: "Cooperative Management Fundamentals",
    skillFocus: "Statutory Compliance",
    duration_minutes: 20,
    passing_score: 75,
    total_questions: 3,
    dueInDays: -3,
    status: "upcoming",
    open_attempt_id: null,
    best_score: null,
    attempts_left: 2,
  },
  {
    id: "assess-acct-midterm",
    title: "Financial Accounting & Bookkeeping Mid-Term",
    programme: "Cooperative Management Fundamentals",
    skillFocus: "Bookkeeping",
    duration_minutes: 30,
    passing_score: 70,
    total_questions: 4,
    dueInDays: null,
    status: "completed",
    open_attempt_id: null,
    best_score: 88,
    attempts_left: 1,
  },
  {
    id: "assess-milk-quality-practical",
    title: "FAT/SNF Milk Quality Testing Practical",
    programme: "Dairy Cooperative Operations",
    skillFocus: "Quality Testing",
    duration_minutes: 20,
    passing_score: 65,
    total_questions: 3,
    dueInDays: null,
    status: "completed",
    open_attempt_id: null,
    best_score: 72,
    attempts_left: 1,
  },
  {
    id: "assess-governance-bylaws",
    title: "Governance & Bylaws Proficiency Test",
    programme: "Cooperative Management Fundamentals",
    skillFocus: "Cooperative Management",
    duration_minutes: 25,
    passing_score: 60,
    total_questions: 3,
    dueInDays: null,
    status: "completed",
    open_attempt_id: null,
    best_score: 91,
    attempts_left: 1,
  },
];

const QUESTION_BANKS: Record<string, Omit<Question, "position">[]> = {
  "assess-coop-law-01": [
    {
      id: "law-q1",
      type: "mcq_single",
      prompt:
        "Under the Multi-State Co-operative Societies Act, what is the core tenet of democratic member control?",
      options: [
        { id: "a", text: "One member, one vote regardless of share capital" },
        { id: "b", text: "Voting power strictly proportional to shares held" },
        { id: "c", text: "Board members hold a permanent veto over resolutions" },
        { id: "d", text: "The registrar appoints all executive directors" },
      ],
      marks: 25,
      topic: "Democratic Governance",
      correct: ["a"],
    },
    {
      id: "law-q2",
      type: "mcq_single",
      prompt:
        "Which of the following is the primary statutory reserve a cooperative society must build before appropriating any dividend?",
      options: [
        { id: "a", text: "5% of total gross turnover" },
        { id: "b", text: "Not less than 25% of annual net profits" },
        { id: "c", text: "The entire entry-fee collection of the society" },
        { id: "d", text: "No reserve is legally required if members approve the accounts" },
      ],
      marks: 25,
      topic: "Statutory Accounting",
      correct: ["b"],
    },
    {
      id: "law-q3",
      type: "mcq_multi",
      prompt:
        "Select every characteristic of the seventh cooperative principle, education, information and communication.",
      options: [
        { id: "a", text: "Members receive training in cooperative principles" },
        { id: "b", text: "The society must publish an annual report to members" },
        { id: "c", text: "Cooperation between societies is actively encouraged" },
        { id: "d", text: "Office bearers must be replaced every year by rotation" },
      ],
      marks: 25,
      topic: "Cooperative Principles",
      correct: ["a", "b"],
    },
    {
      id: "law-q4",
      type: "true_false",
      prompt:
        "A cooperative society can be wound up by the Registrar after an inquiry even when it is solvent and profitable.",
      options: [],
      marks: 25,
      topic: "Registration and Revival",
      correct: true,
    },
  ],
  "assess-dairy-ops-02": [
    {
      id: "dairy-q1",
      type: "mcq_single",
      prompt:
        "A milk batch tests at SNF 8.1% and FAT 3.4%. Against the usual Indian procurement benchmark, how should the collection centre treat this batch?",
      options: [
        { id: "a", text: "Accept at the base rate because it passed the SNF floor" },
        { id: "b", text: "Accept with a quality incentive, as both figures are above the general standard" },
        { id: "c", text: "Reject the batch because FAT must always exceed 4% for cow milk" },
        { id: "d", text: "Hold the batch pending a re-test by the union head office" },
      ],
      marks: 25,
      topic: "Milk Quality Testing",
      correct: ["b"],
    },
    {
      id: "dairy-q2",
      type: "mcq_multi",
      prompt:
        "Which steps belong in the morning milking routine before milk enters the chilling unit?",
      options: [
        { id: "a", text: "Clean the udder and wipe it dry before milking" },
        { id: "b", text: "Discard the first few streams of milk from each teat" },
        { id: "c", text: "Apply teat dip and keep the herd record updated" },
        { id: "d", text: "Hold the milk at ambient temperature to raise its fat" },
      ],
      marks: 25,
      topic: "Milking Practice",
      correct: ["a", "b", "c"],
    },
    {
      id: "dairy-q3",
      type: "mcq_single",
      prompt:
        "A procurement route covers 46 km and the tanker arrives at the chilling plant with the milk at 11.2 degrees Celsius instead of the mandated 4 degrees. What is the primary corrective action?",
      options: [
        { id: "a", text: "Route the milk to the nearest retail packer before chilling" },
        { id: "b", text: "Chill immediately, log the temperature deviation and shorten the route interval" },
        { id: "c", text: "Blend the batch with the previous route's milk" },
        { id: "d", text: "Re-test for SNF before deciding on any action" },
      ],
      marks: 25,
      topic: "Cold Chain",
      correct: ["b"],
    },
    {
      id: "dairy-q4",
      type: "true_false",
      prompt:
        "Fat and SNF testing equipment at a village collection centre should be calibrated against standard milk samples on a fixed schedule.",
      options: [],
      marks: 25,
      topic: "Quality Assurance",
      correct: true,
    },
  ],
  "assess-pacs-daybook-03": [
    {
      id: "pacs-q1",
      type: "mcq_single",
      prompt:
        "A member deposits Rs 5,000 in cash. Under a double-entry system, which entry is correct in the society cash book?",
      options: [
        { id: "a", text: "Debit the member register only, since cash is already counted" },
        { id: "b", text: "Credit the cash book and debit the member's ledger account" },
        { id: "c", text: "Debit the cash book and debit the member's ledger account" },
        { id: "d", text: "Credit the cash book and credit the member's ledger account" },
      ],
      marks: 25,
      topic: "Day-Book Writing",
      correct: ["c"],
    },
    {
      id: "pacs-q2",
      type: "mcq_single",
      prompt:
        "What is the purpose of the cash scroll balance statement?",
      options: [
        { id: "a", text: "To record the society's outstanding loan recoveries" },
        { id: "b", text: "To prove that cash and cash-equivalent balances match the ledger at closing" },
        { id: "c", text: "To calculate the dividend rate for the year" },
        { id: "d", text: "To record the bank reconciliation differences" },
      ],
      marks: 25,
      topic: "Cash Control",
      correct: ["b"],
    },
    {
      id: "pacs-q3",
      type: "mcq_multi",
      prompt:
        "Which registers are statutory for a Primary Agricultural Credit Society?",
      options: [
        { id: "a", text: "Member register" },
        { id: "b", text: "Share register and bonus issue register" },
        { id: "c", text: "Loan, advance and deposit ledger" },
        { id: "d", text: "Purchase register of stationery" },
      ],
      marks: 25,
      topic: "Statutory Registers",
      correct: ["a", "b", "c"],
    },
    {
      id: "pacs-q4",
      type: "true_false",
      prompt:
        "A passbook entry may be corrected by striking it out and writing the new figure, provided the manager initials the correction.",
      options: [],
      marks: 25,
      topic: "Passbook Maintenance",
      correct: false,
    },
  ],
  "assess-fssai-04": [
    {
      id: "fssai-q1",
      type: "mcq_single",
      prompt:
        "Which surface is acceptable for placing milk cans before milking starts?",
      options: [
        { id: "a", text: "A clean, drained concrete platform away from animal housing" },
        { id: "b", text: "Bare soil beside the milking shed" },
        { id: "c", text: "The same platform where calves are washed" },
        { id: "d", text: "Any surface, since cans are sterilised later" },
      ],
      marks: 40,
      topic: "Facility Hygiene",
      correct: ["a"],
    },
    {
      id: "fssai-q2",
      type: "mcq_multi",
      prompt:
        "Which practices reduce post-harvest contamination at a collection centre?",
      options: [
        { id: "a", text: "Cover every can immediately after milking" },
        { id: "b", text: "Keep cleaning chemicals away from the milking area" },
        { id: "c", text: "Store detergents beside open milk cans" },
        { id: "d", text: "Wash cans with a food-grade detergent and dry in shade" },
      ],
      marks: 30,
      topic: "Post-Milking Hygiene",
      correct: ["a", "b", "d"],
    },
    {
      id: "fssai-q3",
      type: "true_false",
      prompt:
        "A cooperative unit that sells packaged dairy products must display the FSSAI licence number on the label.",
      options: [],
      marks: 30,
      topic: "Labelling",
      correct: true,
    },
  ],
  "assess-member-relations-05": [
    {
      id: "member-q1",
      type: "mcq_single",
      prompt:
        "A member disputes a deduction in the final milk payment of the month. What should the supervisor do first?",
      options: [
        { id: "a", text: "Explain the rate card and show the day's test reading, then log the grievance reference" },
        { id: "b", text: "Adjust the payout to keep the member happy and close the issue" },
        { id: "c", text: "Ask the member to speak to the union office next month" },
        { id: "d", text: "Escalate the member's name to the society's defaulting list" },
      ],
      marks: 40,
      topic: "Grievance Redressal",
      correct: ["a"],
    },
    {
      id: "member-q2",
      type: "mcq_multi",
      prompt:
        "Which steps belong in an effective member grievance redressal committee?",
      options: [
        { id: "a", text: "A fixed time limit for disposal of a complaint" },
        { id: "b", text: "A written receipt given to the member at the time of complaint" },
        { id: "c", text: "An appeals route to the district union" },
        { id: "d", text: "Disposal of complaints only at the annual general meeting" },
      ],
      marks: 30,
      topic: "Grievance Systems",
      correct: ["a", "b", "c"],
    },
    {
      id: "member-q3",
      type: "true_false",
      prompt:
        "Only members in good standing should be allowed to vote at a general body meeting.",
      options: [],
      marks: 30,
      topic: "Member Participation",
      correct: true,
    },
  ],
  "assess-statutory-audit-06": [
    {
      id: "audit-q1",
      type: "mcq_single",
      prompt:
        "An auditor finds that the cash balance on the closing day is short by Rs 640 against the cash book. What is the correct first step?",
      options: [
        { id: "a", text: "Post the shortage to the next year's suspense account" },
        { id: "b", text: "Reconcile the day-book, cash scroll and bank statement, then verify the physical cash count" },
        { id: "c", text: "Recover the amount from the cashier's next month salary" },
        { id: "d", text: "Write off the amount as a casual loss" },
      ],
      marks: 40,
      topic: "Cash Audit",
      correct: ["b"],
    },
    {
      id: "audit-q2",
      type: "mcq_multi",
      prompt:
        "Which documents must be produced for a statutory audit of a state cooperative society?",
      options: [
        { id: "a", text: "Minutes of the board and general body meetings" },
        { id: "b", text: "The member register and share certificate records" },
        { id: "c", text: "Loan-wise ledger with recovery classification" },
        { id: "d", text: "The canteen's daily tea register" },
      ],
      marks: 30,
      topic: "Audit Documentation",
      correct: ["a", "b", "c"],
    },
    {
      id: "audit-q3",
      type: "true_false",
      prompt:
        "An inspection report must be placed before the board and discussed at the next general body meeting.",
      options: [],
      marks: 30,
      topic: "Inspection Follow-up",
      correct: true,
    },
  ],
  "assess-acct-midterm": [
    {
      id: "acct-q1",
      type: "mcq_single",
      prompt:
        "A society purchases a grinder for Rs 48,000 with a useful life of 8 years. Which treatment is correct under the standard cooperative accounting policy?",
      options: [
        { id: "a", text: "Charge the full cost to the maintenance account" },
        { id: "b", text: "Treat it as a fixed asset and provide depreciation over its useful life" },
        { id: "c", text: "Treat it as a revenue expense in the year of purchase only" },
        { id: "d", text: "Treat it as a member deposit" },
      ],
      marks: 25,
      topic: "Fixed Assets",
      correct: ["b"],
    },
    {
      id: "acct-q2",
      type: "mcq_single",
      prompt:
        "Surplus appropriation must happen in which order?",
      options: [
        { id: "a", text: "Dividend, bonus, reserve, education fund, carried-forward surplus" },
        { id: "b", text: "Reserve, dividend, education fund, bonus, carried-forward surplus" },
        { id: "c", text: "Dividend, reserve, carried-forward surplus, bonus, education fund" },
        { id: "d", text: "Bonus, dividend, reserve, education fund, carried-forward surplus" },
      ],
      marks: 25,
      topic: "Surplus Appropriation",
      correct: ["a"],
    },
    {
      id: "acct-q3",
      type: "mcq_multi",
      prompt:
        "Which documents make up the audit file of a Primary Agricultural Credit Society?",
      options: [
        { id: "a", text: "Reconciled member passbooks" },
        { id: "b", text: "Stock statement for fertiliser and seed" },
        { id: "c", text: "Agri-stack or core banking exports" },
        { id: "d", text: "Staff attendance register only" },
      ],
      marks: 25,
      topic: "Audit File",
      correct: ["a", "b", "c"],
    },
    {
      id: "acct-q4",
      type: "true_false",
      prompt:
        "A society that has defaulted on a NABARD refinance obligation must disclose the default in its annual report.",
      options: [],
      marks: 25,
      topic: "Disclosure",
      correct: true,
    },
  ],
  "assess-milk-quality-practical": [
    {
      id: "quality-q1",
      type: "mcq_single",
      prompt:
        "While running the Gerber test, the fat column reads below the expected mark. What should the operator do first?",
      options: [
        { id: "a", text: "Record the lower figure so the member is not over-charged" },
        { id: "b", text: "Re-run the test with a fresh sample and check reagent and calibration" },
        { id: "c", text: "Add water to the sample and re-run" },
        { id: "d", text: "Average the reading with the previous route's result" },
      ],
      marks: 35,
      topic: "Test Reliability",
      correct: ["b"],
    },
    {
      id: "quality-q2",
      type: "mcq_single",
      prompt:
        "A sample shows an acidity reading above the rejection limit. What happens next in the cooperative system?",
      options: [
        { id: "a", text: "It is rejected, logged, and the farmer is counselled on milking hygiene" },
        { id: "b", text: "It is pooled with the next batch to dilute the reading" },
        { id: "c", text: "It is paid for at the premium rate" },
        { id: "d", text: "It is stored for 12 hours and re-tested without record" },
      ],
      marks: 35,
      topic: "Rejection Handling",
      correct: ["a"],
    },
    {
      id: "quality-q3",
      type: "true_false",
      prompt:
        "Only the milk procurement supervisor may sign the day-book entry for a route's test readings.",
      options: [],
      marks: 30,
      topic: "Record Integrity",
      correct: false,
    },
  ],
  "assess-governance-bylaws": [
    {
      id: "gov-q1",
      type: "mcq_single",
      prompt:
        "Which body appoints the auditors of a registered cooperative society?",
      options: [
        { id: "a", text: "The members in a general body resolution" },
        { id: "b", text: "The board of directors at its first meeting" },
        { id: "c", text: "The Registrar of Cooperative Societies" },
        { id: "d", text: "The district central cooperative bank" },
      ],
      marks: 40,
      topic: "Statutory Bodies",
      correct: ["a"],
    },
    {
      id: "gov-q2",
      type: "mcq_multi",
      prompt:
        "Which clauses belong in the model bylaws of a primary marketing society?",
      options: [
        { id: "a", text: "Membership eligibility and admission procedure" },
        { id: "b", text: "Procedure for election of the committee" },
        { id: "c", text: "Rules for audit, surplus appropriation and dividends" },
        { id: "d", text: "Nomination of the state government nominee" },
      ],
      marks: 30,
      topic: "Bylaws Drafting",
      correct: ["a", "b", "c"],
    },
    {
      id: "gov-q3",
      type: "true_false",
      prompt:
        "An office bearer who has a personal interest in a contract must disclose it and abstain from the vote.",
      options: [],
      marks: 30,
      topic: "Conflict of Interest",
      correct: true,
    },
  ],
};

/**
 * Resolves the assessment list for the signed-in learner, stamping due dates
 * relative to `now`. Call it from a loader rather than during render.
 */
export function buildTraineeAssessments(now: Date = new Date()): AssessmentSummary[] {
  return DRAFT_ASSESSMENTS.map(({ dueInDays, ...assessment }) => ({
    ...assessment,
    due_date:
      dueInDays === null
        ? null
        : new Date(now.getTime() + dueInDays * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

/** Question bank for an assessment, ordered with positions filled in. */
export function getQuestionBank(assessmentId: string): Question[] {
  const bank = QUESTION_BANKS[assessmentId] ?? [];
  return bank.map((question, index) => ({ ...question, position: index + 1 }));
}

/** Total marks available in an assessment's question bank. */
export function getTotalMarks(questions: Question[]): number {
  return questions.reduce((total, question) => total + question.marks, 0);
}

function answerMatches(question: Question, answer: (string | boolean)[] | undefined): boolean {
  if (!answer || answer.length === 0) return false;
  if (typeof question.correct === "boolean") {
    return answer.length === 1 && answer[0] === question.correct;
  }
  const given = [...answer].map(String).sort();
  const expected = [...question.correct].sort();
  return given.length === expected.length && given.every((value, index) => value === expected[index]);
}

/** Marks an attempt against the answer key and returns the percentage score. */
export function gradeAttempt(
  questions: Question[],
  answers: Record<string, (string | boolean)[]>,
  passingScore: number,
): GradedAttempt {
  const totalMarks = getTotalMarks(questions);
  const scoredMarks = questions.reduce(
    (total, question) => total + (answerMatches(question, answers[question.id]) ? question.marks : 0),
    0,
  );
  const score = totalMarks === 0 ? 0 : Math.round((scoredMarks / totalMarks) * 100);
  return {
    score,
    passed: score >= passingScore,
    correctCount: questions.filter((question) => answerMatches(question, answers[question.id])).length,
    questionCount: questions.length,
  };
}

/** Passing score for an assessment summary, used to colour the completed tab. */
export function isPassingScore(assessment: AssessmentSummary, score: number | null): boolean {
  return score !== null && score >= assessment.passing_score;
}