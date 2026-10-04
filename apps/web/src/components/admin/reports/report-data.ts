import type { ReportKey, ReportResponse } from "@/lib/admin/admin-api";

export type { ReportKey };

export const REPORT_TABS: { key: ReportKey; label: string }[] = [
  { key: "enrollment", label: "Enrollment" },
  { key: "placements", label: "Placements" },
  { key: "assessments", label: "Assessments" },
  { key: "certifications", label: "Certifications" },
];

export const REPORT_PERIODS = [
  { value: 6, label: "Last 6 months" },
  { value: 3, label: "Last 3 months" },
  { value: 12, label: "Last 12 months" },
] as const;

export interface ChartPoint {
  label: string;
  value: number;
}

/** Labelled fallback tables, shown only when the live reports API fails. */
export const DEMO_REPORTS: Record<ReportKey, ReportResponse> = {
  enrollment: {
    key: "enrollment",
    columns: ["Month", "New Enrollments", "Certifications"],
    rows: [
      ["Jan", 980, 610],
      ["Feb", 1120, 720],
      ["Mar", 1340, 880],
      ["Apr", 1260, 840],
      ["May", 1510, 990],
      ["Jun", 1690, 1100],
    ],
    chart: {
      type: "bar",
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      series: [{ name: "New Enrollments", values: [980, 1120, 1340, 1260, 1510, 1690] }],
    },
  },
  placements: {
    key: "placements",
    columns: ["Month", "Placements", "Placement Rate"],
    rows: [
      ["Jan", 210, "61%"],
      ["Feb", 248, "63%"],
      ["Mar", 301, "66%"],
      ["Apr", 287, "65%"],
      ["May", 334, "68%"],
      ["Jun", 362, "71%"],
    ],
    chart: {
      type: "bar",
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      series: [{ name: "Placements", values: [210, 248, 301, 287, 334, 362] }],
    },
  },
  assessments: {
    key: "assessments",
    columns: ["Assessment", "Program", "Trainees", "Average Score"],
    rows: [
      ["Dairy Management Quiz", "Dairy Management", 240, "78%"],
      ["Cooperative Governance Test", "Cooperative Management", 180, "72%"],
      ["Agri Business Assessment", "Agri Business", 120, "81%"],
    ],
    chart: {
      type: "bar",
      labels: ["Dairy", "Governance", "Agri"],
      series: [{ name: "Average Score", values: [78, 72, 81] }],
    },
  },
  certifications: {
    key: "certifications",
    columns: ["Program", "Issued", "Verified", "Pending"],
    rows: [
      ["Dairy Management", 420, 398, 22],
      ["Cooperative Management", 310, 300, 10],
      ["Rural Development", 280, 255, 25],
    ],
    chart: {
      type: "bar",
      labels: ["Dairy", "Coop Mgmt", "Rural"],
      series: [{ name: "Issued", values: [420, 310, 280] }],
    },
  },
};

export const DEMO_DONUT: ChartPoint[] = [
  { label: "Dairy & Livestock", value: 32 },
  { label: "Cooperative Mgmt", value: 24 },
  { label: "Agri Business", value: 13 },
  { label: "Digital Skills", value: 12 },
  { label: "Others", value: 19 },
];

/** Reads the first numeric series of a report chart as label/value points. */
export function chartBars(chart: ReportResponse["chart"]): ChartPoint[] {
  if (chart.labels.length === 0 || chart.series.length === 0) return [];
  const values = chart.series[0].values;
  return chart.labels.map((label, i) => ({ label, value: Number(values[i] ?? 0) }));
}

export const DONUT_COLORS = ["#E31B23", "#1E293B", "#F97316", "#94A3B8", "#FCA5A5", "#CBD5E1"];
