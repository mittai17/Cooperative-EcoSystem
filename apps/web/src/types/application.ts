// =============================================================================
// Application, Nomination, Exam Registration — Types
// =============================================================================

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "pending_trainer"
  | "correction_required"
  | "resubmitted"
  | "trainer_approved"
  | "pending_institution"
  | "institution_approved"
  | "batch_allocated"
  | "waitlisted"
  | "rejected"
  | "withdrawn"
  | "completed";

export type NominationStatus =
  | "draft"
  | "submitted"
  | "cooperative_review"
  | "trainer_review"
  | "correction_required"
  | "approved"
  | "rejected"
  | "institution_confirmation"
  | "batch_allocated";

export type ExamRegistrationStatus =
  | "pending"
  | "slot_confirmed"
  | "exam_scheduled"
  | "completed"
  | "result_published"
  | "certificate_issued"
  | "rejected"
  | "withdrawn";

export interface DocumentRecord {
  type: string;
  label: string;
  required: boolean;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  status: "pending" | "uploaded" | "invalid" | "verified";
  notes?: string;
}

export interface ApplicationPreferences {
  preferredLanguage: string;
  preferredBatch: string;
  modePreference: string;
  hostelRequired: boolean;
  mealRequired: boolean;
  transportRequired: boolean;
  specialNeeds?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: "trainee" | "trainer" | "institution" | "system";
  action: string;
  note?: string;
  status?: ApplicationStatus | NominationStatus | string;
}

export interface BatchAllocation {
  batchId: string;
  batchName: string;
  trainerId: string;
  trainerName: string;
  room: string;
  startDate: string;
  endDate: string;
  time: string;
  mode: string;
  hostelBlock?: string;
  hostelRoom?: string;
  hostelBed?: string;
  seatNumber: number;
}

export interface Application {
  id: string;
  programmeId: string;
  programmeTitle: string;
  programmeType: string;
  institutionId: string;
  institutionName: string;
  traineeId: string;
  traineeName: string;
  traineeEmail: string;
  submittedAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  currentStage: string;
  eligibilityResult: "eligible" | "not_eligible" | "conditional";
  eligibilityDetails: { label: string; met: boolean; reason?: string }[];
  preferences: ApplicationPreferences;
  documents: DocumentRecord[];
  timeline: TimelineEvent[];
  trainerNote?: string;
  correctionNote?: string;
  rejectionReason?: string;
  batchAllocation?: BatchAllocation;
  // wizard step tracking
  draftStep?: number;
  personalInfo?: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    address: string;
    state: string;
    district: string;
    occupation: string;
    cooperativeMembership: string;
    education: string;
    experience: string;
  };
}

export interface Nomination {
  id: string;
  programmeId: string;
  programmeTitle: string;
  institutionId: string;
  institutionName: string;
  traineeId: string;
  traineeName: string;
  cooperativeId: string;
  cooperativeName: string;
  nominatedBy: string;
  submittedAt: string;
  updatedAt: string;
  status: NominationStatus;
  timeline: TimelineEvent[];
  notes?: string;
}

export interface ExamRegistration {
  id: string;
  examId: string;
  examName: string;
  traineeId: string;
  traineeName: string;
  registeredAt: string;
  status: ExamRegistrationStatus;
  slotDate?: string;
  slotTime?: string;
  slotVenue?: string;
  slotMode?: string;
  score?: number;
  passed?: boolean;
  certificateId?: string;
  timeline: TimelineEvent[];
  documents: DocumentRecord[];
}

export interface UpcomingEvent {
  id: string;
  type: "training" | "exam" | "workshop";
  title: string;
  programmeOrExam: string;
  trainer?: string;
  date: string;
  time: string;
  venue: string;
  mode: string;
  status: "confirmed" | "pending" | "cancelled";
  applicationId?: string;
}
