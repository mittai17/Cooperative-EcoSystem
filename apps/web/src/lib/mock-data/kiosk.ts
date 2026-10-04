/**
 * Synthetic demo fixtures for the kiosk hardware surfaces and the trainee
 * certificate detail screen.
 *
 * Nothing in this file is read from a physical device, the NCCT registry or a
 * blockchain anchor. Every value is hand-written so the kiosk and certificate
 * screens are fully reviewable without a Raspberry Pi, a camera or a populated
 * database. Screens surface this with the `.demo-data-tag` class.
 */

import type { EvidenceType } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Signed-in trainee                                                          */
/* -------------------------------------------------------------------------- */

export interface TraineeIdentity {
  id: string;
  /** Name as it appears in the app shell. */
  name: string;
  /** Name exactly as printed on the certificate, used for the ownership check. */
  legalName: string;
  rollNo: string;
  programme: string;
  batch: string;
  institution: string;
  district: string;
  skillPassportId: string;
  enrolledOn: string;
}

export const currentTrainee: TraineeIdentity = {
  id: "TR-2026-0042",
  name: "Ravindra S. Patil",
  legalName: "Ravindra Suresh Patil",
  rollNo: "T-2026-0042",
  programme: "Dairy Cooperative Operations",
  batch: "DAI-26-B2",
  institution: "Institute of Rural Management, Anand",
  district: "Sangli, Maharashtra",
  skillPassportId: "SP-IN-26-118420",
  enrolledOn: "2026-04-06",
};

/* -------------------------------------------------------------------------- */
/* Kiosk device                                                               */
/* -------------------------------------------------------------------------- */

export interface KioskDevice {
  deviceId: string;
  name: string;
  institution: string;
  location: string;
  hardware: string;
  os: string;
  firmwareVersion: string;
  appVersion: string;
  serialNumber: string;
  installedAt: string;
  /** Uptime already accrued when the viewer booted, so the clock is deterministic. */
  uptimeSecondsAtBoot: number;
}

export const kioskDevice: KioskDevice = {
  deviceId: "KSK-MH-ANAND-01",
  name: "Anand Campus Kiosk 01",
  institution: "Institute of Rural Management, Anand",
  location: "Training Block A · Ground Floor",
  hardware: "Raspberry Pi 4 Model B, 4 GB",
  os: "Raspberry Pi OS Lite 64-bit (bookworm)",
  firmwareVersion: "kiosk-runtime 1.8.4",
  appVersion: "CoopSetu Kiosk 2.4.0",
  serialNumber: "RPI4-ANAND-0X41C9",
  installedAt: "2026-07-22",
  uptimeSecondsAtBoot: 5 * 3600 + 42 * 60,
};

/* -------------------------------------------------------------------------- */
/* Live session                                                               */
/* -------------------------------------------------------------------------- */

export interface KioskSession {
  id: string;
  programme: string;
  module: string;
  batch: string;
  trainer: string;
  room: string;
  startsAtLabel: string;
  endsAtLabel: string;
  durationMinutes: number;
  /** Minutes already elapsed at viewer boot, keeps the countdown deterministic. */
  elapsedMinutes: number;
  /** Must equal kioskRoster.length so the present-count denominator is truthful. */
  rosterSize: number;
  /** The 4-character group every ID card for this session carries. */
  tokenGroup: string;
}

export const kioskSession: KioskSession = {
  id: "SES-2026-09-27-B2-AM",
  programme: "Dairy Cooperative Operations",
  module: "Module 3 · Bookkeeping with Tally",
  batch: "DAI-26-B2",
  trainer: "Sunita Deshpande",
  room: "Lab B, VAMNICOM",
  startsAtLabel: "10:00 AM",
  endsAtLabel: "12:00 PM",
  durationMinutes: 120,
  elapsedMinutes: 32,
  rosterSize: 14,
  tokenGroup: "K3D7",
};

/* -------------------------------------------------------------------------- */
/* Trainee ID-card roster                                                     */
/* -------------------------------------------------------------------------- */

export interface RosterTrainee {
  id: string;
  name: string;
  rollNo: string;
  /** Code printed on the trainee's QR ID card, e.g. CS-K3D7-0042. */
  cardCode: string;
  village: string;
  enrolledOn: string;
}

export const kioskRoster: RosterTrainee[] = [
  { id: "TR-2026-0042", name: "Ravindra S. Patil", rollNo: "T-2026-0042", cardCode: "CS-K3D7-0042", village: "Sangli", enrolledOn: "2026-04-06" },
  { id: "TR-2026-0031", name: "Meera Kulkarni", rollNo: "T-2026-0031", cardCode: "CS-K3D7-0031", village: "Miraj", enrolledOn: "2026-04-06" },
  { id: "TR-2026-0055", name: "Arjun Thorat", rollNo: "T-2026-0055", cardCode: "CS-K3D7-0055", village: "Wai", enrolledOn: "2026-04-07" },
  { id: "TR-2026-0063", name: "Sandhya Bhosale", rollNo: "T-2026-0063", cardCode: "CS-K3D7-0063", village: "Karad", enrolledOn: "2026-04-07" },
  { id: "TR-2026-0071", name: "Imran Shaikh", rollNo: "T-2026-0071", cardCode: "CS-K3D7-0071", village: "Satara", enrolledOn: "2026-04-08" },
  { id: "TR-2026-0078", name: "Pooja Jadhav", rollNo: "T-2026-0078", cardCode: "CS-K3D7-0078", village: "Tasgaon", enrolledOn: "2026-04-08" },
  { id: "TR-2026-0084", name: "Ganesh Wagh", rollNo: "T-2026-0084", cardCode: "CS-K3D7-0084", village: "Pandharpur", enrolledOn: "2026-04-09" },
  { id: "TR-2026-0090", name: "Kavita More", rollNo: "T-2026-0090", cardCode: "CS-K3D7-0090", village: "Baramati", enrolledOn: "2026-04-09" },
  { id: "TR-2026-0102", name: "Santosh Pawar", rollNo: "T-2026-0102", cardCode: "CS-K3D7-0102", village: "Shirpur", enrolledOn: "2026-04-10" },
  { id: "TR-2026-0115", name: "Ramesh Yadav", rollNo: "T-2026-0115", cardCode: "CS-K3D7-0115", village: "Nandurbar", enrolledOn: "2026-04-10" },
  { id: "TR-2026-0127", name: "Trupti Salunkhe", rollNo: "T-2026-0127", cardCode: "CS-K3D7-0127", village: "Haveli", enrolledOn: "2026-04-11" },
  { id: "TR-2026-0134", name: "Deepak Chavan", rollNo: "T-2026-0134", cardCode: "CS-K3D7-0134", village: "Katol", enrolledOn: "2026-04-11" },
  { id: "TR-2026-0140", name: "Nanda Gaikwad", rollNo: "T-2026-0140", cardCode: "CS-K3D7-0140", village: "Baramati", enrolledOn: "2026-04-12" },
  { id: "TR-2026-0148", name: "Shubham Kadam", rollNo: "T-2026-0148", cardCode: "CS-K3D7-0148", village: "Koregaon", enrolledOn: "2026-04-12" },
];

/** Printed ID-card code format: two-letter scheme, session group, roll serial. */
export const CARD_CODE_PATTERN = /^CS-[A-Z0-9]{4}-\d{4}$/;

export const CARD_CODE_FORMAT_HINT = "CS-K3D7-0000";

/* -------------------------------------------------------------------------- */
/* Face recognition engine                                                    */
/* -------------------------------------------------------------------------- */

export interface FaceEngineStatus {
  engine: string;
  runtime: string;
  matching: string;
  accuracyTarget: string;
  enrolledCount: number;
  rosterCount: number;
  enrolmentMode: string;
  lastEnrolmentAt: string;
  retentionNotice: string;
}

export const faceEngine: FaceEngineStatus = {
  engine: "OpenCV DNN + InsightFace buffalo_l (ArcFace, 512-d embeddings)",
  runtime: "WASM module coopsetu-face@0.9.2 — not bundled in this build",
  matching: "Cosine similarity, 0.62 threshold, liveness by 2-frame motion check",
  accuracyTarget: "Target 97.5% TAR at 0.1% FAR on the NCCT validation set",
  enrolledCount: 11,
  rosterCount: 14,
  enrolmentMode: "Trainer-supervised capture during induction week",
  lastEnrolmentAt: "2026-09-19",
  retentionNotice:
    "Templates are stored on device only and deleted when a learner exits the programme. No face image leaves the kiosk.",
};

export interface BiometricTemplate {
  traineeId: string;
  confidenceScore: number;
  livenessVerified: boolean;
  templateVersion: string;
  enrolledDate: string;
}

export const biometricTemplates: Record<string, BiometricTemplate> = {
  "TR-2026-0042": { traineeId: "TR-2026-0042", confidenceScore: 0.962, livenessVerified: true, templateVersion: "v1.4", enrolledDate: "2026-09-18" },
  "TR-2026-0031": { traineeId: "TR-2026-0031", confidenceScore: 0.941, livenessVerified: true, templateVersion: "v1.4", enrolledDate: "2026-09-18" },
  "TR-2026-0055": { traineeId: "TR-2026-0055", confidenceScore: 0.895, livenessVerified: true, templateVersion: "v1.4", enrolledDate: "2026-09-18" },
  "TR-2026-0063": { traineeId: "TR-2026-0063", confidenceScore: 0.954, livenessVerified: true, templateVersion: "v1.4", enrolledDate: "2026-09-19" },
  "TR-2026-0071": { traineeId: "TR-2026-0071", confidenceScore: 0.912, livenessVerified: true, templateVersion: "v1.4", enrolledDate: "2026-09-19" },
  "TR-2026-0078": { traineeId: "TR-2026-0078", confidenceScore: 0.938, livenessVerified: true, templateVersion: "v1.4", enrolledDate: "2026-09-19" },
  "TR-2026-0084": { traineeId: "TR-2026-0084", confidenceScore: 0.925, livenessVerified: true, templateVersion: "v1.4", enrolledDate: "2026-09-19" },
  "TR-2026-0090": { traineeId: "TR-2026-0090", confidenceScore: 0.947, livenessVerified: true, templateVersion: "v1.4", enrolledDate: "2026-09-19" },
  "TR-2026-0102": { traineeId: "TR-2026-0102", confidenceScore: 0.884, livenessVerified: true, templateVersion: "v1.4", enrolledDate: "2026-09-19" },
  "TR-2026-0115": { traineeId: "TR-2026-0115", confidenceScore: 0.931, livenessVerified: true, templateVersion: "v1.4", enrolledDate: "2026-09-19" },
  "TR-2026-0127": { traineeId: "TR-2026-0127", confidenceScore: 0.908, livenessVerified: true, templateVersion: "v1.4", enrolledDate: "2026-09-19" },
};

/* -------------------------------------------------------------------------- */
/* Session log                                                                */
/* -------------------------------------------------------------------------- */

export type SessionLogTone = "recorded" | "duplicate" | "failed" | "manual" | "system";

export interface SessionLogEntry {
  id: string;
  at: string;
  title: string;
  detail: string;
  tone: SessionLogTone;
}

export interface SeededAttendance {
  traineeId: string;
  at: string;
  method: "qr" | "manual" | "biometric";
}

/**
 * Check-ins already on the register when the viewer opens, so the duplicate
 * guard can be demonstrated on the first scan without any setup.
 */
export const seededAttendance: SeededAttendance[] = [
  { traineeId: "TR-2026-0042", at: "09:58 AM", method: "qr" },
  { traineeId: "TR-2026-0031", at: "10:01 AM", method: "qr" },
  { traineeId: "TR-2026-0055", at: "10:03 AM", method: "manual" },
];

export const seededSessionLog: SessionLogEntry[] = [
  {
    id: "log-seed-3",
    at: "10:03 AM",
    title: "Manual override · Arjun Thorat",
    detail: "T-2026-0055 marked present by the trainer. Phone battery dead.",
    tone: "manual",
  },
  {
    id: "log-seed-2",
    at: "10:01 AM",
    title: "QR accepted · Meera Kulkarni",
    detail: "CS-K3D7-0031 · 34 s after session start.",
    tone: "recorded",
  },
  {
    id: "log-seed-1",
    at: "09:58 AM",
    title: "QR accepted · Ravindra S. Patil",
    detail: "CS-K3D7-0042 · 2 min before session start.",
    tone: "recorded",
  },
  {
    id: "log-seed-0",
    at: "09:55 AM",
    title: "Session opened",
    detail: "Register reset for SES-2026-09-27-B2-AM. Token group K3D7.",
    tone: "system",
  },
];

/* -------------------------------------------------------------------------- */
/* Device health                                                              */
/* -------------------------------------------------------------------------- */

export type HealthState = "ok" | "warn" | "down" | "idle";

export interface HealthSignal {
  id: string;
  label: string;
  state: HealthState;
  reading: string;
  detail: string;
  /** Seconds since this signal last reported; ticked up by the status screen. */
  ageSeconds: number;
}

export const kioskHealthSignals: HealthSignal[] = [
  {
    id: "network",
    label: "Network",
    state: "ok",
    reading: "Online · Wi-Fi",
    detail: "coopsetu-institute-wifi · RSSI -58 dBm",
    ageSeconds: 6,
  },
  {
    id: "camera",
    label: "Camera",
    state: "warn",
    reading: "No device enumerated",
    detail: "Expected /dev/video0 from the USB OV5647. Not present on this build.",
    ageSeconds: 41,
  },
  {
    id: "scanner",
    label: "QR scanner",
    state: "ok",
    reading: "Trigger line idle",
    detail: "GPIO 17 (BCM) low · optical decoder served by the same camera.",
    ageSeconds: 6,
  },
  {
    id: "printer",
    label: "Thermal printer",
    state: "warn",
    reading: "Idle · 1 job queued",
    detail: "58 mm Epson TM-T20 · 1 duplicate-alert slip waiting to print.",
    ageSeconds: 96,
  },
  {
    id: "storage",
    label: "Storage",
    state: "ok",
    reading: "21.4 GB free of 32 GB",
    detail: "67% free · kiosk purges the offline cache below 10% free.",
    ageSeconds: 1800,
  },
  {
    id: "clock",
    label: "Clock sync",
    state: "ok",
    reading: "+0.4 s drift",
    detail: "NTP pool ntp.ubuntu.com · next forced resync in 3 h 12 m.",
    ageSeconds: 1800,
  },
];

/* -------------------------------------------------------------------------- */
/* Offline sync queue                                                         */
/* -------------------------------------------------------------------------- */

export type QueueItemKind = "attendance" | "heartbeat" | "roster" | "assessment" | "print";

export interface QueuedSyncItem {
  id: string;
  kind: QueueItemKind;
  label: string;
  detail: string;
  bytes: number;
  createdAt: string;
  attempts: number;
}

/**
 * Mirrors the shape written by `enqueueSyncItem` in `src/lib/offline/db.ts`.
 * Ordered oldest first, because that is the order the status screen drains in:
 * the first pending row is the one pushed next.
 */
export const seededSyncQueue: QueuedSyncItem[] = [
  {
    id: "q-seed-0001",
    kind: "attendance",
    label: "Attendance register · Module 1",
    detail: "13 of 14 present, 1 manual override",
    bytes: 18_432,
    createdAt: "09:14 AM",
    attempts: 0,
  },
  {
    id: "q-seed-0002",
    kind: "print",
    label: "Duplicate-alert slip · CS-K3D7-0031",
    detail: "Queued to the 58 mm thermal printer",
    bytes: 1_024,
    createdAt: "10:31 AM",
    attempts: 1,
  },
  {
    id: "q-seed-0003",
    kind: "roster",
    label: "Roster delta · batch DAI-26-B2",
    detail: "2 transfers, 1 readmission",
    bytes: 6_144,
    createdAt: "10:48 AM",
    attempts: 0,
  },
  {
    id: "q-seed-0004",
    kind: "assessment",
    label: "Module 2 · Module-end assessment",
    detail: "14 submissions, scored 12/14",
    bytes: 41_216,
    createdAt: "11:06 AM",
    attempts: 0,
  },
];

export const lastSyncedLabel = "11:04 AM";

/** The endpoint the production client posts to; nothing in this build calls it. */
export const SYNC_TRANSPORT_ENDPOINT = "POST /api/v1/offline-sync/batch";

/* -------------------------------------------------------------------------- */
/* Device event log                                                           */
/* -------------------------------------------------------------------------- */

export type DeviceEventLevel = "info" | "warn" | "error";

export interface DeviceEvent {
  id: string;
  at: string;
  level: DeviceEventLevel;
  message: string;
}

export const seededEventLog: DeviceEvent[] = [
  {
    id: "evt-seed-4",
    at: "11:06 AM",
    level: "warn",
    message: "Sync batch queued 4 items after a 240 ms API timeout",
  },
  {
    id: "evt-seed-3",
    at: "10:52 AM",
    level: "info",
    message: "Camera probe failed: NotFoundError — no videoinput device present",
  },
  {
    id: "evt-seed-2",
    at: "10:31 AM",
    level: "warn",
    message: "Duplicate card CS-K3D7-0031 rejected; alert slip sent to printer",
  },
  {
    id: "evt-seed-1",
    at: "09:55 AM",
    level: "info",
    message: "Session SES-2026-09-27-B2-AM opened by trainer Sunita Deshpande",
  },
  {
    id: "evt-seed-0",
    at: "07:12 AM",
    level: "info",
    message: "Viewer started, local cache mounted, 1.2 GB free space check passed",
  },
];

/* -------------------------------------------------------------------------- */
/* Device-local admin actions                                                 */
/* -------------------------------------------------------------------------- */

export interface DeviceActionSpec {
  id: "restart-service" | "clear-cache" | "factory-reset";
  label: string;
  summary: string;
  /** Exactly what the confirm step will do when pressed, stated without spin. */
  consequence: string;
  /** Shown in the confirm dialog so nobody guesses at the blast radius. */
  scope: string;
  /** When set, the operator must type this word to arm the action. */
  confirmPhrase?: string;
  destructive: boolean;
}

export const deviceActions: DeviceActionSpec[] = [
  {
    id: "restart-service",
    label: "Restart kiosk service",
    summary: "Re-run device health checks and reload the viewer session state.",
    consequence:
      "On deployed hardware this button calls `systemctl restart coopsetu-kiosk`. This build has no shell access, so it re-runs every health probe, re-reads the register and records the event in the log below.",
    scope: "Device-local. The offline register is left untouched.",
    destructive: false,
  },
  {
    id: "clear-cache",
    label: "Clear local cache",
    summary: "Delete cached course content and the offline sync queue from this device.",
    consequence:
      "Removes every cached course and every queued sync item from this browser's IndexedDB (coopsetu_offline_db), then reports how many records were deleted.",
    scope: "Device-local and irreversible. Unsynced attendance records are lost.",
    confirmPhrase: "CLEAR",
    destructive: true,
  },
  {
    id: "factory-reset",
    label: "Factory-reset viewer",
    summary: "Wipe local storage, caches, settings and the event log on this device.",
    consequence:
      "Clears localStorage, sessionStorage and the whole IndexedDB database, then returns the viewer to its post-install state. The register is re-fetched from the server on the next successful sync.",
    scope: "Device-local and irreversible. Every local preference is lost.",
    confirmPhrase: "RESET",
    destructive: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Certificate details                                                        */
/* -------------------------------------------------------------------------- */

export interface SkillEvidenceRecord {
  type: EvidenceType;
  title: string;
  date: string;
}

export interface CertifiedSkill {
  skill: string;
  /** Short statement of what was assessed. */
  outcome: string;
  evidence: SkillEvidenceRecord[];
}

export interface CertificateDetail {
  id: string;
  /** National Cooperative Certification Council registry reference. */
  ncctReference: string;
  /** CoopSetu AI programme code used on the Skill Passport. */
  programmeCode: string;
  learnerCode: string;
  durationHours: number;
  deliveryMode: string;
  assessmentBoard: string;
  seatNumber: string;
  coordinator: string;
  skills: CertifiedSkill[];
  /** Immutable registry anchors printed in the document's verification block. */
  anchors: { label: string; value: string }[];
}

export const certificateDetails: Record<string, CertificateDetail> = {
  "CST-2026-DAI-00842": {
    id: "CST-2026-DAI-00842",
    ncctReference: "NCCT/2026/DAI/ANAND/00842",
    programmeCode: "CSAI-PGM-DAIRY-24",
    learnerCode: "LEARNER-IN-MH-118420",
    durationHours: 120,
    deliveryMode: "Blended · 96 h classroom, 24 h cooperative field placement",
    assessmentBoard: "NCCT Sector Skill Council · Dairy & Livestock",
    seatNumber: "AN-2026-DAIRY-11",
    coordinator: "Dr. Ashwin Bhosale, Head of Training",
    skills: [
      {
        skill: "Dairy Operations",
        outcome: "Ran a 42-cow dairy unit's morning milking rota and herd record for 10 consecutive days.",
        evidence: [
          { type: "Assessment", title: "Practical viva · herd recording and milk reconciliation", date: "2026-06-12" },
          { type: "Project", title: "Field placement report · Baramati Taluka dairy unit", date: "2026-05-29" },
        ],
      },
      {
        skill: "Quality Testing",
        outcome: "Executed SNF, fat and acidity tests to IS 1186 and logged rejects against a rejection-rate target.",
        evidence: [
          { type: "Assessment", title: "Written paper 2 · milk quality and testing", date: "2026-06-14" },
          { type: "Course", title: "Module 4 · Testing and quality control", date: "2026-05-11" },
        ],
      },
      {
        skill: "Logistics Planning",
        outcome: "Planned a 9-day cold-chain route for 1,800 litres of milk with a 3.2% wastage ceiling.",
        evidence: [
          { type: "Project", title: "Capstone · collection-route optimisation model", date: "2026-06-16" },
          { type: "Employer Feedback", title: "Placement supervisor feedback · Sangli dairy union", date: "2026-06-18" },
        ],
      },
    ],
    anchors: [
      { label: "Registry entry", value: "NCCT/2026/DAI/ANAND/00842" },
      { label: "CoopSetu anchor", value: "0x8f3ac41d…09c219" },
      { label: "Hash algorithm", value: "SHA-256 over the canonical certificate JSON" },
    ],
  },
  "CST-2025-COOP-01193": {
    id: "CST-2025-COOP-01193",
    ncctReference: "NCCT/2025/COOP/DELHI/01193",
    programmeCode: "CSAI-PGM-COOPF-11",
    learnerCode: "LEARNER-IN-DL-204517",
    durationHours: 80,
    deliveryMode: "In-person · NCUTC training centre",
    assessmentBoard: "NCCT Sector Skill Council · Cooperative Governance",
    seatNumber: "DL-2025-COOP-04",
    coordinator: "Smt. Kavita Rane, Principal",
    skills: [
      {
        skill: "Cooperative Management",
        outcome: "Prepared and presented audited annual accounts for a 1,200-member society.",
        evidence: [
          { type: "Assessment", title: "Practical paper · society accounts and surplus appropriation", date: "2025-11-24" },
        ],
      },
      {
        skill: "Governance",
        outcome: "Modelled a board election and drafted the resolutions for a 12-seat committee.",
        evidence: [
          { type: "Course", title: "Module 6 · Governance, elections and the model bylaws", date: "2025-10-14" },
        ],
      },
      {
        skill: "Bylaws Drafting",
        outcome: "Drafted a compliant set of bylaws for a new primary marketing society.",
        evidence: [
          { type: "Project", title: "Capstone · model bylaws for a 400-member PACS", date: "2025-11-28" },
        ],
      },
    ],
    anchors: [
      { label: "Registry entry", value: "NCCT/2025/COOP/DELHI/01193" },
      { label: "CoopSetu anchor", value: "0x51b7d0aa…7f41c8" },
      { label: "Hash algorithm", value: "SHA-256 over the canonical certificate JSON" },
    ],
  },
  "CST-2024-CRD-00317": {
    id: "CST-2024-CRD-00317",
    ncctReference: "NCCT/2024/CRD/PUNE/00317",
    programmeCode: "CSAI-PGM-AGCR-07",
    learnerCode: "LEARNER-IN-MH-091260",
    durationHours: 96,
    deliveryMode: "Blended · VAMNICOM campus and field visits",
    assessmentBoard: "NCCT Sector Skill Council · Agricultural Credit",
    seatNumber: "PN-2024-CR-19",
    coordinator: "Dr. Lata Mhaske, Faculty Head",
    skills: [
      {
        skill: "Credit Appraisal",
        outcome: "Appraised 18 loan proposals against the NCCTL viability norms with a full cash-flow model.",
        evidence: [
          { type: "Assessment", title: "Practical paper · loan appraisal and sanction note", date: "2024-03-19" },
        ],
      },
      {
        skill: "Risk Management",
        outcome: "Built a recovery plan for a portfolio where 14% of principal was overdue.",
        evidence: [
          { type: "Project", title: "Capstone · NPA recovery strategy for a 3.1 crore portfolio", date: "2024-03-22" },
        ],
      },
      {
        skill: "Compliance",
        outcome: "Filed a KYC-complete disbursement file that cleared a full inspection without a query.",
        evidence: [
          { type: "Course", title: "Module 5 · RBI norms, KYC and audit of cooperative societies", date: "2024-02-27" },
        ],
      },
    ],
    anchors: [
      { label: "Registry entry", value: "NCCT/2024/CRD/PUNE/00317" },
      { label: "CoopSetu anchor", value: "0xa91c4477…2be05d" },
      { label: "Hash algorithm", value: "SHA-256 over the canonical certificate JSON" },
    ],
  },
  "CST-2026-DMK-00459": {
    id: "CST-2026-DMK-00459",
    ncctReference: "NCCT/2026/DMK/GANDHINAGAR/00459",
    programmeCode: "CSAI-PGM-DMKT-15",
    learnerCode: "LEARNER-IN-GJ-331904",
    durationHours: 64,
    deliveryMode: "Online · LIINAA",
    assessmentBoard: "NCCT Sector Skill Council · Marketing",
    seatNumber: "GJ-2026-DMK-02",
    coordinator: "Prof. Nikhil Trivedi, Course Director",
    skills: [
      {
        skill: "Digital Marketing",
        outcome: "Built and ran a three-channel campaign that lifted cooperative produce enquiries by 2.4x.",
        evidence: [
          { type: "Project", title: "Capstone · cooperative produce campaign plan", date: "2026-07-30" },
        ],
      },
      {
        skill: "E-commerce",
        outcome: "Listed 40 SKUs on the cooperative storefront with a reconciled fulfilment workflow.",
        evidence: [
          { type: "Assessment", title: "Practical paper · storefront listing and fulfilment", date: "2026-08-01" },
        ],
      },
    ],
    anchors: [
      { label: "Registry entry", value: "NCCT/2026/DMK/GANDHINAGAR/00459" },
      { label: "CoopSetu anchor", value: "0xc4e80f13…5a2d7b" },
      { label: "Hash algorithm", value: "SHA-256 over the canonical certificate JSON" },
    ],
  },
};

/**
 * Public origin used to build the shareable verification link printed on the
 * document. Deployment should set NEXT_PUBLIC_SITE_URL; the fallback is the
 * documented production origin so the printed text, the QR preview and the
 * copied link stay byte-identical between server render and print.
 */
export const PUBLIC_SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "https://coopsetu.ai";

export function verificationPath(certificateId: string): string {
  return `/verify-certificate/${certificateId}`;
}

export function verificationUrl(certificateId: string): string {
  return `${PUBLIC_SITE_ORIGIN}${verificationPath(certificateId)}`;
}

export function getFallbackRoster(): RosterTrainee[] {
  return kioskRoster;
}

export function getFallbackSession(): KioskSession {
  return kioskSession;
}

export function getFallbackDevice(): KioskDevice {
  return kioskDevice;
}

export function getFallbackHealthSignals(): HealthSignal[] {
  return kioskHealthSignals;
}
