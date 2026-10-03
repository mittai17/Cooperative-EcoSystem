import type { AuditLog } from "@/lib/admin/admin-api";

/** Labelled fallback rows, shown only when the live audit log API fails. */
export const DEMO_AUDIT_LOGS: AuditLog[] = [
  { id: "demo-audit-1", actor_name: "Admin User", action: "settings.update", entity: "settings", entity_id: null, created_at: "2026-10-03T09:42:00+05:30", meta: null },
  { id: "demo-audit-2", actor_name: "Priya Singh", action: "certificate.verify", entity: "certificate", entity_id: "CERT-2026-0411", created_at: "2026-10-03T09:15:00+05:30", meta: null },
  { id: "demo-audit-3", actor_name: "Rohan Mehta", action: "programme.create", entity: "programme", entity_id: "PRG-0037", created_at: "2026-10-02T17:03:00+05:30", meta: null },
  { id: "demo-audit-4", actor_name: "Admin User", action: "user.update", entity: "user", entity_id: "USR-1182", created_at: "2026-10-02T11:28:00+05:30", meta: null },
  { id: "demo-audit-5", actor_name: "Anjali Rao", action: "job.create", entity: "job", entity_id: "JOB-0219", created_at: "2026-10-01T16:50:00+05:30", meta: null },
  { id: "demo-audit-6", actor_name: "Vikram Joshi", action: "assessment.create", entity: "assessment", entity_id: "ASM-0093", created_at: "2026-10-01T10:05:00+05:30", meta: null },
];
