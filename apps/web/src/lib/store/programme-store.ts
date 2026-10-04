"use client";
// =============================================================================
// Programme Store — localStorage-backed shared state for the registration module
// This is the single source of truth, shared across trainee/trainer/institution
// =============================================================================
import { useState, useEffect, useCallback } from "react";
import type { Application, Nomination, ExamRegistration, ApplicationStatus, DocumentRecord, TimelineEvent, BatchAllocation } from "@/types/application";
import { MOCK_APPLICATIONS, MOCK_NOMINATIONS, MOCK_EXAM_REGISTRATIONS, MOCK_UPCOMING_EVENTS } from "@/lib/mock-data/applications-data";

const APPS_KEY = "nurvex_programme_applications";
const NOMS_KEY = "nurvex_programme_nominations";
const EXAMS_KEY = "nurvex_exam_registrations";
const SAVED_KEY = "nurvex_saved_programmes";
const DRAFTS_KEY = "nurvex_application_drafts";

// ─── storage helpers ──────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ─── Applications ─────────────────────────────────────────────────────────────
export function useApplications() {
  const [applications, setApplications] = useState<Application[]>(() =>
    load(APPS_KEY, MOCK_APPLICATIONS)
  );

  const refresh = useCallback(() => {
    setApplications(load(APPS_KEY, MOCK_APPLICATIONS));
  }, []);

  const persist = useCallback((apps: Application[]) => {
    save(APPS_KEY, apps);
    setApplications(apps);
    // Dispatch custom event so other hook instances (trainer page, etc.) can react
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("nurvex_apps_changed"));
    }
  }, []);

  useEffect(() => {
    const handler = () => setApplications(load(APPS_KEY, MOCK_APPLICATIONS));
    window.addEventListener("nurvex_apps_changed", handler);
    return () => window.removeEventListener("nurvex_apps_changed", handler);
  }, []);

  const createApplication = useCallback(
    (app: Application) => {
      const updated = [...applications.filter((a) => a.id !== app.id), app];
      persist(updated);
    },
    [applications, persist]
  );

  const updateApplicationStatus = useCallback(
    (
      appId: string,
      status: ApplicationStatus,
      actor: string,
      actorRole: TimelineEvent["actorRole"],
      note?: string,
      extra?: Partial<Application>
    ) => {
      const updated = applications.map((a) => {
        if (a.id !== appId) return a;
        const tlEvent: TimelineEvent = {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor,
          actorRole,
          action: statusToAction(status),
          note,
          status,
        };
        return {
          ...a,
          status,
          updatedAt: new Date().toISOString(),
          currentStage: statusToStage(status),
          timeline: [...a.timeline, tlEvent],
          ...(note && actorRole === "trainer" ? { trainerNote: note } : {}),
          ...(status === "correction_required" ? { correctionNote: note } : {}),
          ...(status === "rejected" ? { rejectionReason: note } : {}),
          ...extra,
        };
      });
      persist(updated);
    },
    [applications, persist]
  );

  const updateApplicationDocuments = useCallback(
    (appId: string, documents: DocumentRecord[]) => {
      const updated = applications.map((a) =>
        a.id === appId ? { ...a, documents, updatedAt: new Date().toISOString() } : a
      );
      persist(updated);
    },
    [applications, persist]
  );

  const allocateBatch = useCallback(
    (appId: string, allocation: BatchAllocation) => {
      updateApplicationStatus(
        appId,
        "batch_allocated",
        "System",
        "system",
        `Batch allocated: ${allocation.batchId}`,
        { batchAllocation: allocation }
      );
    },
    [updateApplicationStatus]
  );

  const withdrawApplication = useCallback(
    (appId: string) => {
      updateApplicationStatus(appId, "withdrawn", "Trainee", "trainee", "Application withdrawn by trainee");
    },
    [updateApplicationStatus]
  );

  const getByTrainee = useCallback(
    (traineeId: string) => applications.filter((a) => a.traineeId === traineeId),
    [applications]
  );

  const getPendingForTrainer = useCallback(
    () => applications.filter((a) => a.status === "pending_trainer" || a.status === "resubmitted"),
    [applications]
  );

  const getPendingForInstitution = useCallback(
    () => applications.filter((a) => a.status === "trainer_approved"),
    [applications]
  );

  return {
    applications,
    refresh,
    createApplication,
    updateApplicationStatus,
    updateApplicationDocuments,
    allocateBatch,
    withdrawApplication,
    getByTrainee,
    getPendingForTrainer,
    getPendingForInstitution,
  };
}

// ─── Nominations ──────────────────────────────────────────────────────────────
export function useNominations() {
  const [nominations, setNominations] = useState<Nomination[]>(() =>
    load(NOMS_KEY, MOCK_NOMINATIONS)
  );

  const persist = useCallback((noms: Nomination[]) => {
    save(NOMS_KEY, noms);
    setNominations(noms);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("nurvex_noms_changed"));
    }
  }, []);

  useEffect(() => {
    const handler = () => setNominations(load(NOMS_KEY, MOCK_NOMINATIONS));
    window.addEventListener("nurvex_noms_changed", handler);
    return () => window.removeEventListener("nurvex_noms_changed", handler);
  }, []);

  const createNomination = useCallback(
    (nom: Nomination) => {
      persist([...nominations.filter((n) => n.id !== nom.id), nom]);
    },
    [nominations, persist]
  );

  const getByTrainee = useCallback(
    (traineeId: string) => nominations.filter((n) => n.traineeId === traineeId),
    [nominations]
  );

  return { nominations, createNomination, getByTrainee };
}

// ─── Exam Registrations ───────────────────────────────────────────────────────
export function useExamRegistrations() {
  const [examRegs, setExamRegs] = useState<ExamRegistration[]>(() =>
    load(EXAMS_KEY, MOCK_EXAM_REGISTRATIONS)
  );

  const persist = useCallback((regs: ExamRegistration[]) => {
    save(EXAMS_KEY, regs);
    setExamRegs(regs);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("nurvex_exams_changed"));
    }
  }, []);

  useEffect(() => {
    const handler = () => setExamRegs(load(EXAMS_KEY, MOCK_EXAM_REGISTRATIONS));
    window.addEventListener("nurvex_exams_changed", handler);
    return () => window.removeEventListener("nurvex_exams_changed", handler);
  }, []);

  const registerForExam = useCallback(
    (reg: ExamRegistration) => {
      persist([...examRegs.filter((e) => e.id !== reg.id), reg]);
    },
    [examRegs, persist]
  );

  const approveExamReg = useCallback(
    (regId: string, slotDate: string, slotTime: string, slotVenue: string) => {
      const updated = examRegs.map((e) => {
        if (e.id !== regId) return e;
        return {
          ...e,
          status: "slot_confirmed" as const,
          slotDate,
          slotTime,
          slotVenue,
          timeline: [
            ...e.timeline,
            {
              id: `er-tl-${Date.now()}`,
              timestamp: new Date().toISOString(),
              actor: "NCCT Examination Cell",
              actorRole: "institution" as const,
              action: `Slot confirmed — ${slotVenue}, ${slotTime}, ${slotDate}`,
            },
          ],
        };
      });
      persist(updated);
    },
    [examRegs, persist]
  );

  const getByTrainee = useCallback(
    (traineeId: string) => examRegs.filter((e) => e.traineeId === traineeId),
    [examRegs]
  );

  return { examRegs, registerForExam, approveExamReg, getByTrainee };
}

// ─── Saved Programmes ─────────────────────────────────────────────────────────
export function useSavedProgrammes() {
  const [saved, setSaved] = useState<string[]>(() => load(SAVED_KEY, []));

  const toggle = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      save(SAVED_KEY, next);
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  return { saved, toggle, isSaved };
}

// ─── Application Drafts ───────────────────────────────────────────────────────
export function useApplicationDrafts() {
  const [drafts, setDrafts] = useState<Record<string, Partial<Application>>>(() =>
    load(DRAFTS_KEY, {})
  );

  const saveDraft = useCallback((programmeId: string, data: Partial<Application>) => {
    setDrafts((prev) => {
      const next = { ...prev, [programmeId]: { ...prev[programmeId], ...data } };
      save(DRAFTS_KEY, next);
      return next;
    });
  }, []);

  const getDraft = useCallback(
    (programmeId: string): Partial<Application> | undefined => drafts[programmeId],
    [drafts]
  );

  const clearDraft = useCallback((programmeId: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[programmeId];
      save(DRAFTS_KEY, next);
      return next;
    });
  }, []);

  return { saveDraft, getDraft, clearDraft };
}

// ─── Upcoming Events ──────────────────────────────────────────────────────────
export function useUpcomingEvents() {
  const [events] = useState(MOCK_UPCOMING_EVENTS);
  return { events };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusToAction(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    draft: "Saved as draft",
    submitted: "Application submitted",
    pending_trainer: "Sent for trainer review",
    correction_required: "Correction requested",
    resubmitted: "Application resubmitted",
    trainer_approved: "Approved by trainer",
    pending_institution: "Sent for institution confirmation",
    institution_approved: "Seat confirmed by institution",
    batch_allocated: "Batch allocated",
    waitlisted: "Added to waitlist",
    rejected: "Application rejected",
    withdrawn: "Application withdrawn",
    completed: "Programme completed",
  };
  return map[status] ?? status;
}

function statusToStage(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    draft: "Draft",
    submitted: "Submitted",
    pending_trainer: "Pending Trainer Review",
    correction_required: "Correction Required",
    resubmitted: "Resubmitted",
    trainer_approved: "Institution Confirmation",
    pending_institution: "Pending Institution",
    institution_approved: "Seat Confirmed",
    batch_allocated: "Batch Confirmed",
    waitlisted: "Waitlisted",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    completed: "Completed",
  };
  return map[status] ?? status;
}

// ─── ID generator ─────────────────────────────────────────────────────────────
export function generateApplicationId(): string {
  const num = Math.floor(400 + Math.random() * 200);
  return `CSA-2026-00${num}`;
}

export function generateNominationId(): string {
  const num = Math.floor(100 + Math.random() * 200);
  return `NOM-2026-00${num}`;
}

export function generateExamRegId(): string {
  const num = Math.floor(50 + Math.random() * 100);
  return `EXAM-REG-2026-00${num}`;
}
