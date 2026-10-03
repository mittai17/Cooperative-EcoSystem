import type { Institution, InstitutionStatus } from "@/lib/admin/admin-api";
import { STATE_ABBREVIATIONS } from "@/components/admin/dashboard/format";

/** The backend stores every institution with type "institution". */
export const INSTITUTION_TYPE_OPTIONS = [{ value: "institution", label: "Institution" }] as const;

export const INSTITUTION_STATUSES: { value: InstitutionStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const INDIAN_STATES: string[] = Object.keys(STATE_ABBREVIATIONS).sort((a, b) => a.localeCompare(b));

const LOGO_TINTS = [
  "bg-tint-blue-bg text-tint-blue-fg",
  "bg-tint-green-bg text-tint-green-fg",
  "bg-tint-amber-bg text-tint-amber-fg",
  "bg-tint-violet-bg text-tint-violet-fg",
  "bg-tint-red-bg text-tint-red-fg",
];

export function logoTint(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return LOGO_TINTS[hash % LOGO_TINTS.length];
}

/** Fictional fallback rows, shown only behind the DemoBanner when the API fails. */
export const DEMO_INSTITUTIONS: Institution[] = [
  demo(1, "VAMNICOM", "Maharashtra", "Pune", "active", 68, 1240, 12, "https://www.vamnicom.gov.in"),
  demo(2, "Amul Dairy Training Centre", "Gujarat", "Anand", "active", 54, 980, 9, null),
  demo(3, "NCDC Training Institute", "Delhi", "New Delhi", "active", 42, 860, 7, null),
  demo(4, "Sahakar Bharati College", "Karnataka", "Bengaluru", "active", 38, 720, 6, null),
  demo(5, "Gujarat Cooperative College", "Gujarat", "Ahmedabad", "active", 36, 650, 6, null),
  demo(6, "Maharashtra State Coop. Inst.", "Maharashtra", "Nagpur", "active", 28, 540, 4, null),
  demo(7, "Karnataka Dairy Training Inst.", "Karnataka", "Mysuru", "active", 26, 480, 4, null),
  demo(8, "Tamil Nadu Coop. Training Centre", "Tamil Nadu", "Chennai", "active", 22, 420, 3, null),
  demo(9, "Kerala Cooperative Institute", "Kerala", "Thiruvananthapuram", "inactive", 18, 380, 0, null),
  demo(10, "Assam Cooperative College", "Assam", "Guwahati", "active", 16, 320, 2, null),
];

/** Under review is not tracked by the platform, so it has no count. */
export const DEMO_INSTITUTION_STATS = { total: 128, active: 112, under_review: null, inactive: 4 };

function demo(
  n: number,
  name: string,
  state: string,
  city: string,
  status: InstitutionStatus,
  trainers: number,
  trainees: number,
  programmes: number,
  website: string | null,
): Institution {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
  return {
    id: `demo-${n}`,
    name,
    type: "institution",
    state,
    district: city,
    address: `${city}, ${state} (fictional sample address)`,
    pincode: null,
    phone: null,
    email: `info@${slug}.example.in`,
    website,
    accreditation_number: null,
    status,
    trainers,
    trainees,
    programmes,
  };
}
