export type AttStatus = "present" | "absent" | "late" | "excused";

export interface ClassOption {
  batch_id: string;
  course_id: string;
  batch: string;
  course: string;
}
export interface Options {
  batches: { id: string; name: string }[];
  courses: { id: string; title: string }[];
  classes: ClassOption[];
}
export interface SlotItem {
  slot_id: string;
  date: string;
  course: string;
  course_id: string | null;
  batch: string;
  batch_id: string;
  start_label: string;
  end_label: string;
  room: string | null;
  roster: number;
  status: "not_started" | "live" | "completed";
  session_id: string | null;
  present: number | null;
}
export interface SlotsResponse extends Options {
  tab: "today" | "upcoming";
  items: SlotItem[];
}
export interface HistoryItem {
  session_id: string;
  date: string;
  time: string;
  name: string | null;
  course: string;
  batch: string;
  present: number;
  late: number;
  excused: number;
  absent: number;
  roster: number;
  percentage: number | null;
}
export interface HistoryResponse extends Options {
  tab: "history";
  items: HistoryItem[];
}
export interface RosterRow {
  trainee_id: string;
  name: string;
  initials: string;
  code: string;
  status: AttStatus;
  marked: boolean;
  method: string | null;
  time: string | null;
}
export interface SessionState {
  id: string;
  name: string | null;
  course: string | null;
  batch: string;
  room: string | null;
  methods: string[];
  status: "live" | "closed";
  opens_at: string;
  closes_at: string;
  seconds_left: number;
  present: number;
  late: number;
  roster_size: number;
  qr: string | null;
  qr_expires_in: number | null;
  recent: { trainee_id: string; name: string; time: string; method: string; status: string }[];
  roster: RosterRow[];
  percentage?: number | null;
  counts?: Record<AttStatus, number>;
}

export const STATUS_STYLE: Record<AttStatus, string> = {
  present: "bg-success/10 text-success",
  late: "bg-warning/15 text-amber-700",
  excused: "bg-blue-500/10 text-blue-600",
  absent: "bg-destructive/10 text-destructive",
};
export const STATUS_LABEL: Record<AttStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};
export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
