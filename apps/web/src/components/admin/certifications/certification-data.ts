import type { Certification, CertificationStatus } from "@/lib/admin/admin-api";

export const CERTIFICATE_STATUSES: { value: CertificationStatus; label: string }[] = [
  { value: "valid", label: "Valid" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
];

/** Labelled fallback rows, shown only when the live certifications API fails. */
export const DEMO_CERTIFICATIONS: Certification[] = [
  { id: "demo-cert-1", verification_code: "DEMO-0001", holder_name: "Amit Verma", programme_title: "Dairy Management", grade: "A", issue_date: "2026-10-03", expiry_date: null, status: "valid" },
  { id: "demo-cert-2", verification_code: "DEMO-0002", holder_name: "Neha Patel", programme_title: "Cooperative Management", grade: "B+", issue_date: "2026-10-02", expiry_date: null, status: "valid" },
  { id: "demo-cert-3", verification_code: "DEMO-0003", holder_name: "Rahul Thakur", programme_title: "Cooperative Accounting", grade: "B", issue_date: "2026-10-01", expiry_date: null, status: "revoked" },
  { id: "demo-cert-4", verification_code: "DEMO-0004", holder_name: "Sunil Parmar", programme_title: "Rural Development", grade: "A", issue_date: "2025-09-29", expiry_date: "2026-09-29", status: "expired" },
  { id: "demo-cert-5", verification_code: "DEMO-0005", holder_name: "Pooja Sharma", programme_title: "Food Safety", grade: "A-", issue_date: "2026-09-28", expiry_date: null, status: "valid" },
];
