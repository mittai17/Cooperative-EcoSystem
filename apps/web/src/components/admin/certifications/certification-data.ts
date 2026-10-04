import type { Certification, CertificationStatus } from "@/lib/admin/admin-api";

export const CERTIFICATE_STATUSES: { value: CertificationStatus; label: string }[] = [
  { value: "valid", label: "Valid" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
];

/** Labelled fallback rows, shown only when the live certifications API fails or is empty. */
export const DEMO_CERTIFICATIONS: Certification[] = [
  { id: "demo-cert-1", verification_code: "NCCT-2026-0001", holder_name: "Amit Verma", programme_title: "Dairy Cooperative Operations", grade: "A", issue_date: "2026-10-03", expiry_date: null, status: "valid" },
  { id: "demo-cert-2", verification_code: "NCCT-2026-0002", holder_name: "Neha Patel", programme_title: "Cooperative Bookkeeping & Audit Readiness", grade: "B+", issue_date: "2026-10-02", expiry_date: null, status: "valid" },
  { id: "demo-cert-3", verification_code: "NCCT-2026-0003", holder_name: "Rahul Thakur", programme_title: "PACS Secretary Professional Foundation", grade: "B", issue_date: "2026-10-01", expiry_date: null, status: "revoked" },
  { id: "demo-cert-4", verification_code: "NCCT-2025-0004", holder_name: "Sunil Parmar", programme_title: "Fishery Collectives & Marine Value Chain", grade: "A", issue_date: "2025-09-29", expiry_date: "2026-09-29", status: "expired" },
  { id: "demo-cert-5", verification_code: "NCCT-2026-0005", holder_name: "Pooja Sharma", programme_title: "Cooperative Cold Chain & Post-Harvest Logistics", grade: "A-", issue_date: "2026-09-28", expiry_date: null, status: "valid" },
  { id: "demo-cert-6", verification_code: "NCCT-2026-0006", holder_name: "Kiran Deshmukh", programme_title: "Organic Farm Aggregation & FPO Linkage", grade: "A+", issue_date: "2026-09-25", expiry_date: null, status: "valid" },
  { id: "demo-cert-7", verification_code: "NCCT-2026-0007", holder_name: "Arjun Kumar", programme_title: "Digital ERP & Cloud Records for Cooperatives", grade: "A", issue_date: "2026-09-20", expiry_date: null, status: "valid" },
  { id: "demo-cert-8", verification_code: "NCCT-2026-0008", holder_name: "Meera Singh", programme_title: "Urban Credit Cooperative Compliance & Audit", grade: "B+", issue_date: "2026-09-18", expiry_date: null, status: "valid" },
];
