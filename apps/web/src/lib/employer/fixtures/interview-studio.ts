import type { InterviewJob } from "@/lib/employer/ai-interview-api";
import { mockEmployerJobs } from "@/lib/employer/fixtures/catalog";

export const mockInterviewJobs: InterviewJob[] = mockEmployerJobs
  .filter((job) => job.status !== "closed")
  .map((job) => ({ id: job.id, title: job.title, status: job.status }));

const POSTING_QUESTIONS: Record<string, string[]> = {
  "emp-job-dairy-supervisor": [
    "Welcome! To begin, walk us through your experience running milk procurement routes across primary agricultural cooperative societies.",
    "How do you verify FAT and SNF readings, and what do you do when an automated analyser drifts out of calibration?",
    "Describe a cold chain deviation you handled. How did you contain it and who did you inform?",
    "How would you explain a route consolidation plan to village society secretaries who are new to digital reporting?",
  ],
  "emp-job-quality-analyst": [
    "Walk us through your daily lab routine for milk quality testing and how you record the results.",
    "How do you maintain the FSSAI licence file and the HACCP plan so that an audit closes without observations?",
    "A lot shows an antibiotic residue result above the limit. Describe exactly what you do next.",
    "How do you train village society testers on sampling and analyser SOPs?",
  ],
  "emp-job-mis-analyst": [
    "Summarise your technical background and why you want to work in cooperative sector analytics.",
    "Which MIS returns do you build, and how do you standardise them across district unions?",
    "Tell me about a data quality problem you found and how you traced it back to the source society.",
    "How do you explain a dashboard to a state federation board that is not comfortable with data?",
  ],
  "emp-job-society-accountant": [
    "Tell us about the statutory registers you maintain for a primary society and how you close them each month.",
    "How do you reconcile member dividend and DBT payouts against the bank statement?",
    "Describe a discrepancy you found during an audit and how you resolved it.",
    "What does AGM financial statement preparation involve for a four thousand member society?",
  ],
  "emp-job-store-manager": [
    "Walk us through your daily routine running a cooperative retail counter.",
    "How do you manage stock, shelf life and daily closing for a value added dairy outlet?",
    "How have you grown footfall through ONDC, WhatsApp and local market promotions?",
    "How do you handle cash handover and daily stock statements?",
  ],
  "emp-job-cold-chain": [
    "Tell us about your experience planning cold chain dispatch for pooled milk and dairy products.",
    "A reefer truck reports a temperature spike midway through transit. What are your immediate steps?",
    "How do you coordinate with rural milk pooling centres so quality is not compromised in transit?",
    "Which ERP or warehouse management systems have you used to keep cold storage loss near zero?",
  ],
  "emp-job-pacs-trainee": [
    "Summarise what you understand about how a primary society procures, dispatches and pays members.",
    "How would you record a member receipt in a digital register instead of a paper one?",
    "What does member service look like at a village collection point during peak morning hours?",
    "Why do you want to build a career in the cooperative sector?",
  ],
};

const DEFAULT_QUESTIONS: string[] = [
  "Could you start by summarising your relevant technical background and why you are interested in working within the cooperative ecosystem?",
  "Describe a complex technical challenge you recently solved and the methodical steps you followed.",
  "How do you approach strict regulatory compliance, quality control, and safety standard operating procedures?",
  "In a cooperative model, teamwork and community upliftment are central. How have you collaborated across cross-functional teams in past roles?",
];

export function questionsForJob(jobId: string): string[] {
  return POSTING_QUESTIONS[jobId] ?? DEFAULT_QUESTIONS;
}