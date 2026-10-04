/**
 * Registry rows for the certificates issued to the demo learner.
 *
 * `lib/mock-data/kiosk.ts` carries the registry detail for the sample dairy
 * certificate that the kiosk and public verification screens share. Credentials
 * the learner earned later need the same anchors (NCCT reference, learner code,
 * programme code, seat number, certified skills and evidence), so they are
 * declared here and the detail screen falls back to this map.
 */
import type { CertificateDetail } from "@/lib/mock-data/kiosk";
import { traineeProfile } from "@/lib/trainee/identity";

export const traineeCertificateDetails: Record<string, CertificateDetail> = {
  "CST-2026-LDR-00518": {
    id: "CST-2026-LDR-00518",
    ncctReference: "NCCT/2026/LDR/DELHI/00518",
    programmeCode: "CSAI-PGM-COOPF-11",
    learnerCode: "LEARNER-IN-MH-118420",
    durationHours: 80,
    deliveryMode: "Online · 60 h self-paced, 20 h synchronous practice",
    assessmentBoard: "NCCT Sector Skill Council · Cooperative Governance",
    seatNumber: "DL-2026-COOP-27",
    coordinator: "Smt. Kavita Rane, Principal",
    skills: [
      {
        skill: "Cooperative Management",
        outcome: "Planned and presented the agenda and resolutions of a 12-seat committee's annual meeting.",
        evidence: [
          { type: "Assessment", title: "Written paper 1 · governance and the seven principles", date: "2026-07-24" },
          { type: "Project", title: "Capstone · annual general meeting plan for a 1,200-member society", date: "2026-07-28" },
        ],
      },
      {
        skill: "Governance",
        outcome: "Ran a mock board election for a 12-seat committee and documented the poll count.",
        evidence: [
          { type: "Assessment", title: "Written paper 2 · elections, quorum and board composition", date: "2026-07-26" },
          { type: "Course", title: "Module 5 · governance, elections and the model bylaws", date: "2026-06-30" },
        ],
      },
      {
        skill: "Bylaws Drafting",
        outcome: "Drafted a compliant set of bylaws for a new primary marketing society of 400 members.",
        evidence: [
          { type: "Project", title: "Capstone · model bylaws and amendment clause set", date: "2026-08-01" },
          { type: "Employer Feedback", title: "Field internship review · Sangli dairy union", date: "2026-08-04" },
        ],
      },
    ],
    anchors: [
      { label: "Registry entry", value: "NCCT/2026/LDR/DELHI/00518" },
      { label: "NURVEX anchor", value: "0xb7d40e29…51c7a3" },
      { label: "Hash algorithm", value: "SHA-256 over the canonical certificate JSON" },
    ],
  },
  "CST-2026-BKP-00674": {
    id: "CST-2026-BKP-00674",
    ncctReference: "NCCT/2026/BKP/PUNE/00674",
    programmeCode: "CSAI-PGM-AGCR-07",
    learnerCode: "LEARNER-IN-MH-118420",
    durationHours: 96,
    deliveryMode: "Blended · 64 h classroom, 32 h cooperative field placement",
    assessmentBoard: "NCCT Sector Skill Council · Finance and Accounts",
    seatNumber: "PN-2026-BKP-08",
    coordinator: "Dr. Lata Mhaske, Faculty Head",
    skills: [
      {
        skill: "Bookkeeping",
        outcome: "Maintained the day-book and cash scroll of a 4,000-member credit society for six weeks.",
        evidence: [
          { type: "Project", title: "Field placement report · day-book and cash scroll of Vaikunth PACS", date: "2026-09-04" },
          { type: "Assessment", title: "Practical paper 1 · day-book, cash scroll and reconciliation", date: "2026-08-29" },
        ],
      },
      {
        skill: "Statutory Compliance",
        outcome: "Prepared an inspection-ready audit file for a PACS covering members, shares and loans.",
        evidence: [
          { type: "Assessment", title: "Practical paper 2 · statutory registers and audit schedule", date: "2026-08-30" },
          { type: "Course", title: "Module 4 · RBI norms, KYC and cooperative audit", date: "2026-07-14" },
        ],
      },
      {
        skill: "Tally",
        outcome: "Migrated a three-year manual ledger into Tally with a reconciled opening balance sheet.",
        evidence: [
          { type: "Project", title: "Capstone · Tally migration and reconciliation report", date: "2026-09-08" },
        ],
      },
    ],
    anchors: [
      { label: "Registry entry", value: "NCCT/2026/BKP/PUNE/00674" },
      { label: "NURVEX anchor", value: "0x3ac9f5d8…b02e6f" },
      { label: "Hash algorithm", value: "SHA-256 over the canonical certificate JSON" },
    ],
  },
};

/** Learner identity as printed on every certificate detail screen. */
export const certificateIdentity = {
  name: traineeProfile.name,
  legalName: traineeProfile.legalName,
  rollNo: traineeProfile.rollNo,
  batch: traineeProfile.batch,
  institution: traineeProfile.institution,
};