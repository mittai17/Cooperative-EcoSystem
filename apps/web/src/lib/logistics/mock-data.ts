/**
 * NURVEX — Logistics Module Seed Data
 *
 * Fulfils spec §11 exactly:
 *   3 institutions / 5 campuses
 *   12 programmes / 24 batches
 *   18 vehicles (12 van, 22 minibus, 40 bus; 2 in maintenance)
 *   22 drivers / 4 vendors
 *   10 routes / 35 stops
 *   40 plans / 75 trips
 *   600 passenger assignments
 *   25 requests / 12 incidents / 50 expenses
 *   Named trips TRP-2026-0142 through TRP-2026-0146
 *   1 capacity conflict plan / 1 driver overlap / 1 Needs Review plan
 *
 * Nothing is exported that is not used by the service; treat every export as
 * read-only. The service spreads/derives to produce mutable working copies.
 */

import type {
  Institution,
  Vehicle,
  Driver,
  Vendor,
  Route,
  RouteStop,
  TransportPlan,
  Trip,
  PassengerAssignment,
  PassengerStatus,
  TransportRequest,
  Incident,
  TripExpense,
  AuditEvent,
} from "./types";

// ---------------------------------------------------------------------------
// Reference "today" — keeps overdue / expiry flags stable in demos
// ---------------------------------------------------------------------------
export const LOGISTICS_DEMO_TODAY = "2026-10-03";
export const LOGISTICS_DEMO_TODAY_DT = "2026-10-03T00:00:00+05:30";

// ---------------------------------------------------------------------------
// Institutions & Campuses
// ---------------------------------------------------------------------------
export const INSTITUTIONS: Institution[] = [
  {
    id: "INST-001",
    name: "VAMNICOM",
    code: "VAMNICOM",
    timezone: "Asia/Kolkata",
    campuses: [
      { id: "CAMP-001", institutionId: "INST-001", name: "VAMNICOM Pune", location: "Pune, Maharashtra" },
    ],
  },
  {
    id: "INST-002",
    name: "RICM Lucknow",
    code: "RICM-LKO",
    timezone: "Asia/Kolkata",
    campuses: [
      { id: "CAMP-002", institutionId: "INST-002", name: "RICM Lucknow Main", location: "Lucknow, Uttar Pradesh" },
      { id: "CAMP-003", institutionId: "INST-002", name: "RICM Varanasi Annex", location: "Varanasi, Uttar Pradesh" },
    ],
  },
  {
    id: "INST-003",
    name: "ICM Hyderabad",
    code: "ICM-HYD",
    timezone: "Asia/Kolkata",
    campuses: [
      { id: "CAMP-004", institutionId: "INST-003", name: "ICM Hyderabad", location: "Hyderabad, Telangana" },
      { id: "CAMP-005", institutionId: "INST-003", name: "ICM Warangal", location: "Warangal, Telangana" },
    ],
  },
];

// Default demo institution (VAMNICOM Pune) used by the institution workspace
export const DEMO_INSTITUTION_ID = "INST-001";
export const DEMO_CAMPUS_ID = "CAMP-001";

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------
export const VENDORS: Vendor[] = [
  { id: "VND-001", name: "Sahyadri Travel Co.", contactPhone: "020-24567890", contractRef: "VTC/2026/001", active: true },
  { id: "VND-002", name: "Deccan Transport Services", contactPhone: "020-25678901", contractRef: "DTS/2026/001", active: true },
  { id: "VND-003", name: "Western Express Fleet", contactPhone: "020-26789012", contractRef: "WEF/2026/001", active: true },
  { id: "VND-004", name: "City Cab Cooperative", contractRef: "CCC/2026/001", contactPhone: "020-27890123", active: false },
];

// ---------------------------------------------------------------------------
// Vehicles  (18 total: 6 vans, 7 minibuses, 5 buses; V-005 & V-010 maintenance)
// ---------------------------------------------------------------------------
const makeVehicle = (
  i: number,
  type: "12-seat Van" | "22-seat Minibus" | "40-seat Bus",
  cap: number,
  vendorId: string | null,
  maintenanceStatus: "Available" | "Maintenance",
  permitExpiry: string,
  insuranceExpiry: string,
): Vehicle => ({
  id: `VEH-${String(i).padStart(3, "0")}`,
  assetCode: `V-${String(i).padStart(3, "0")}`,
  registrationNumber: `MH12A${String(1000 + i)}`,
  type,
  seatingCapacity: cap,
  accessibilityFeatures: i % 4 === 0 ? ["Wheelchair ramp", "Priority seating"] : [],
  vendorId,
  permitExpiry,
  insuranceExpiry,
  maintenanceStatus,
  active: maintenanceStatus !== "Maintenance",
  campusId: DEMO_CAMPUS_ID,
  institutionId: DEMO_INSTITUTION_ID,
});

export const VEHICLES: Vehicle[] = [
  makeVehicle(1, "12-seat Van", 12, null, "Available", "2027-03-15", "2027-05-20"),
  makeVehicle(2, "12-seat Van", 12, null, "Available", "2027-01-10", "2027-02-28"),
  makeVehicle(3, "12-seat Van", 12, "VND-001", "Available", "2027-04-20", "2027-06-15"),
  makeVehicle(4, "12-seat Van", 12, "VND-001", "Available", "2026-12-31", "2027-01-15"), // permit expiring soon
  makeVehicle(5, "12-seat Van", 12, "VND-002", "Maintenance", "2027-02-10", "2027-03-30"), // maintenance
  makeVehicle(6, "12-seat Van", 12, "VND-002", "Available", "2027-05-01", "2027-07-10"),
  makeVehicle(7, "22-seat Minibus", 22, null, "Available", "2027-03-01", "2027-04-15"),
  makeVehicle(8, "22-seat Minibus", 22, null, "Available", "2027-06-10", "2027-08-20"),
  makeVehicle(9, "22-seat Minibus", 22, "VND-001", "Available", "2027-01-20", "2027-03-05"),
  makeVehicle(10, "22-seat Minibus", 22, "VND-003", "Maintenance", "2027-04-15", "2027-06-01"), // maintenance
  makeVehicle(11, "22-seat Minibus", 22, "VND-003", "Available", "2027-02-28", "2027-04-30"),
  makeVehicle(12, "22-seat Minibus", 22, "VND-003", "Available", "2026-11-30", "2026-12-31"), // insurance expiring very soon
  makeVehicle(13, "22-seat Minibus", 22, null, "Available", "2027-07-01", "2027-09-15"),
  makeVehicle(14, "40-seat Bus", 40, "VND-002", "Available", "2027-03-20", "2027-05-10"),
  makeVehicle(15, "40-seat Bus", 40, "VND-002", "Available", "2027-01-25", "2027-03-01"),
  makeVehicle(16, "40-seat Bus", 40, "VND-001", "Available", "2027-05-15", "2027-07-20"),
  makeVehicle(17, "40-seat Bus", 40, "VND-003", "Available", "2027-02-05", "2027-04-10"),
  makeVehicle(18, "40-seat Bus", 40, null, "Available", "2027-06-25", "2027-08-30"),
];

// ---------------------------------------------------------------------------
// Drivers  (22 total; D-006 on leave; D-019 licence expiring; D-022 inactive)
// ---------------------------------------------------------------------------
const makeDriver = (
  i: number,
  name: string,
  availability: "Available" | "Assigned" | "On Leave" | "Inactive",
  licenceExpiry: string,
  vendorId: string | null,
): Driver => ({
  id: `DRV-${String(i).padStart(3, "0")}`,
  name,
  contactPhone: `98${String(2000000 + i * 137)}`,
  licenceRef: `DL/MH/${String(2018 + (i % 5))}/${String(100000 + i)}`,
  licenceExpiry,
  vendorId,
  availability,
  active: availability !== "Inactive",
  institutionId: DEMO_INSTITUTION_ID,
});

export const DRIVERS: Driver[] = [
  makeDriver(1, "Ramesh Yadav", "Available", "2028-03-15", null),
  makeDriver(2, "Suresh Patil", "Assigned", "2027-11-20", null),
  makeDriver(3, "Mahesh Kamble", "Available", "2028-06-10", "VND-001"),
  makeDriver(4, "Dinesh Shinde", "Available", "2027-09-05", null),
  makeDriver(5, "Ganesh More", "Assigned", "2028-01-30", "VND-001"),
  makeDriver(6, "Rakesh Deshmukh", "On Leave", "2027-12-18", "VND-002"),
  makeDriver(7, "Umesh Kadam", "Available", "2028-04-22", null),
  makeDriver(8, "Vijay Jadhav", "Available", "2027-10-14", "VND-002"),
  makeDriver(9, "Anil Bhosale", "Assigned", "2028-02-07", null),
  makeDriver(10, "Pradeep Mane", "Available", "2028-07-19", "VND-003"),
  makeDriver(11, "Nilesh Kale", "Available", "2027-08-28", null),
  makeDriver(12, "Rajesh Gaikwad", "Assigned", "2028-05-03", "VND-003"),
  makeDriver(13, "Sunil Waghmare", "Available", "2028-09-11", null),
  makeDriver(14, "Kishore Thakare", "Available", "2027-07-25", null),
  makeDriver(15, "Milind Chavan", "Available", "2028-11-08", "VND-001"),
  makeDriver(16, "Sanjay Kulkarni", "Available", "2028-03-30", null),
  makeDriver(17, "Ajay Sawant", "Assigned", "2027-06-12", "VND-002"),
  makeDriver(18, "Vikram Salve", "Available", "2028-10-01", null),
  makeDriver(19, "Deepak Jagtap", "Available", "2026-11-15", null), // licence expiring soon
  makeDriver(20, "Santosh Pawar", "Available", "2028-01-17", "VND-003"),
  makeDriver(21, "Nandkumar Pol", "Assigned", "2027-05-20", null),
  makeDriver(22, "Ashok Wani", "Inactive", "2025-12-31", null),
];

// ---------------------------------------------------------------------------
// Programmes (12) and Batches (24)
// ---------------------------------------------------------------------------
export const PROGRAMMES = [
  { id: "PRG-001", code: "CMF", title: "Cooperative Management Fundamentals", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-09-01", endDate: "2026-11-30" },
  { id: "PRG-002", code: "CBK", title: "Cooperative Bookkeeping & Statutory Audit Readiness", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-09-15", endDate: "2026-12-15" },
  { id: "PRG-003", code: "DCO", title: "Dairy Cooperative Operations", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-10-01", endDate: "2026-12-31" },
  { id: "PRG-004", code: "PACS-DA", title: "PACS Digital Accounting", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-10-10", endDate: "2027-01-10" },
  { id: "PRG-005", code: "ACC", title: "Agricultural Credit Cooperative Management", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-08-01", endDate: "2026-10-31" },
  { id: "PRG-006", code: "ACC-CERT", title: "Accounting Certification", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-11-01", endDate: "2027-01-31" },
  { id: "PRG-007", code: "HCE", title: "Handloom & Handicraft Cooperative Enterprise", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-09-01", endDate: "2026-11-30" },
  { id: "PRG-008", code: "CFA", title: "Cooperative Finance & Audit", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-10-15", endDate: "2027-01-15" },
  { id: "PRG-009", code: "RBM", title: "Rural Business Management", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-10-01", endDate: "2026-12-31" },
  { id: "PRG-010", code: "AGRI-MKT", title: "Agri Marketing & Value Chain", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-11-01", endDate: "2027-02-28" },
  { id: "PRG-011", code: "FISH", title: "Fisheries Cooperative Management", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-09-15", endDate: "2026-12-15" },
  { id: "PRG-012", code: "DAIRY-ADV", title: "Advanced Dairy Technology", institutionId: DEMO_INSTITUTION_ID, campusId: DEMO_CAMPUS_ID, startDate: "2026-10-05", endDate: "2027-01-05" },
];

export const BATCHES = [
  { id: "BATCH-001", programmeId: "PRG-001", code: "CMF-A-26", size: 28, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-002", programmeId: "PRG-001", code: "CMF-B-26", size: 24, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-003", programmeId: "PRG-002", code: "CBK-A-26", size: 22, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-004", programmeId: "PRG-002", code: "CBK-B-26", size: 20, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-005", programmeId: "PRG-003", code: "DCO-A-26", size: 30, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-006", programmeId: "PRG-003", code: "DCO-B-26", size: 26, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-007", programmeId: "PRG-004", code: "PACS-DA-A-26", size: 32, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-008", programmeId: "PRG-004", code: "PACS-DA-B-26", size: 28, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-009", programmeId: "PRG-005", code: "ACC-A-26", size: 25, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-010", programmeId: "PRG-005", code: "ACC-B-26", size: 22, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-011", programmeId: "PRG-006", code: "ACC-CERT-A-26", size: 40, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-012", programmeId: "PRG-006", code: "ACC-CERT-B-26", size: 38, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-013", programmeId: "PRG-007", code: "HCE-A-26", size: 20, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-014", programmeId: "PRG-007", code: "HCE-B-26", size: 18, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-015", programmeId: "PRG-008", code: "CFA-A-26", size: 30, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-016", programmeId: "PRG-008", code: "CFA-B-26", size: 28, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-017", programmeId: "PRG-009", code: "RBM-A-26", size: 26, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-018", programmeId: "PRG-009", code: "RBM-B-26", size: 24, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-019", programmeId: "PRG-010", code: "AGRI-MKT-A-26", size: 35, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-020", programmeId: "PRG-010", code: "AGRI-MKT-B-26", size: 30, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-021", programmeId: "PRG-011", code: "FISH-A-26", size: 22, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-022", programmeId: "PRG-011", code: "FISH-B-26", size: 20, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-023", programmeId: "PRG-012", code: "DAIRY-ADV-A-26", size: 28, campusId: DEMO_CAMPUS_ID },
  { id: "BATCH-024", programmeId: "PRG-012", code: "DAIRY-ADV-B-26", size: 25, campusId: DEMO_CAMPUS_ID },
];

// ---------------------------------------------------------------------------
// Routes and Stops (10 routes / 35 stops)
// ---------------------------------------------------------------------------
const makeStop = (
  id: string,
  routeId: string,
  seq: number,
  name: string,
  address: string,
  start: string,
  end: string,
  accessible = false,
): RouteStop => ({
  id,
  routeId,
  sequence: seq,
  locationName: name,
  address,
  pickupWindowStart: start,
  pickupWindowEnd: end,
  instructions: `Board from ${name}. Wait at the main gate.`,
  accessiblePickup: accessible,
});

export const ROUTES: Route[] = [
  {
    id: "RTE-001",
    name: "Pune City – VAMNICOM Campus",
    institutionId: DEMO_INSTITUTION_ID,
    campusId: DEMO_CAMPUS_ID,
    description: "Main commuter pickup route from Pune railway station",
    stops: [
      makeStop("STP-001", "RTE-001", 1, "Pune Railway Station", "Dr. D.B. Deodhar Path, Pune", "07:30", "07:45", true),
      makeStop("STP-002", "RTE-001", 2, "Shivajinagar Bus Stand", "Shivajinagar, Pune", "07:55", "08:05"),
      makeStop("STP-003", "RTE-001", 3, "Deccan Gymkhana", "Deccan Gymkhana, Pune", "08:10", "08:20"),
      makeStop("STP-004", "RTE-001", 4, "VAMNICOM Main Gate", "VAMNICOM, Bajaj Nagar, Pune", "08:30", "08:40", true),
    ],
  },
  {
    id: "RTE-002",
    name: "VAMNICOM – Anand Dairy Site Visit",
    institutionId: DEMO_INSTITUTION_ID,
    campusId: DEMO_CAMPUS_ID,
    description: "Field visit route to Anand dairy cooperative",
    stops: [
      makeStop("STP-005", "RTE-002", 1, "VAMNICOM Main Gate", "VAMNICOM, Bajaj Nagar, Pune", "09:00", "09:15", true),
      makeStop("STP-006", "RTE-002", 2, "Pune–Mumbai Highway NH-48 Entry", "NH-48 Khopoli, Pune", "09:30", "09:40"),
      makeStop("STP-007", "RTE-002", 3, "Anand Dairy Cooperative Entrance", "Anand, Gujarat", "13:00", "13:15"),
    ],
  },
  {
    id: "RTE-003",
    name: "Pune Airport – VAMNICOM Campus",
    institutionId: DEMO_INSTITUTION_ID,
    campusId: DEMO_CAMPUS_ID,
    description: "Airport pickup for outstation trainees",
    stops: [
      makeStop("STP-008", "RTE-003", 1, "Pune Airport Arrival Exit", "Pune International Airport, Lohegaon", "06:00", "06:30", true),
      makeStop("STP-009", "RTE-003", 2, "Yerwada Circle", "Yerwada, Pune", "06:45", "06:55"),
      makeStop("STP-010", "RTE-003", 3, "VAMNICOM Main Gate", "VAMNICOM, Bajaj Nagar, Pune", "07:15", "07:30", true),
    ],
  },
  {
    id: "RTE-004",
    name: "VAMNICOM – Exam Centre (Kothrud)",
    institutionId: DEMO_INSTITUTION_ID,
    campusId: DEMO_CAMPUS_ID,
    description: "Exam-day transport to Kothrud exam centre",
    stops: [
      makeStop("STP-011", "RTE-004", 1, "VAMNICOM Main Gate", "VAMNICOM, Bajaj Nagar, Pune", "08:00", "08:15", true),
      makeStop("STP-012", "RTE-004", 2, "University Circle", "Ganeshkhind Road, Pune", "08:25", "08:35"),
      makeStop("STP-013", "RTE-004", 3, "Kothrud Exam Centre", "Kothrud, Pune", "08:45", "09:00", true),
    ],
  },
  {
    id: "RTE-005",
    name: "VAMNICOM – Panchgani Retreat",
    institutionId: DEMO_INSTITUTION_ID,
    campusId: DEMO_CAMPUS_ID,
    description: "Annual leadership retreat route",
    stops: [
      makeStop("STP-014", "RTE-005", 1, "VAMNICOM Main Gate", "VAMNICOM, Bajaj Nagar, Pune", "07:00", "07:15"),
      makeStop("STP-015", "RTE-005", 2, "Satara Road Junction", "Satara Rd, Pune", "07:45", "07:55"),
      makeStop("STP-016", "RTE-005", 3, "Panchgani Retreat Centre", "Panchgani, Maharashtra", "09:30", "09:45"),
    ],
  },
  {
    id: "RTE-006",
    name: "VAMNICOM – Pune Industry Tour",
    institutionId: DEMO_INSTITUTION_ID,
    campusId: DEMO_CAMPUS_ID,
    description: "Industry exposure tour stops across Pimpri-Chinchwad",
    stops: [
      makeStop("STP-017", "RTE-006", 1, "VAMNICOM Main Gate", "VAMNICOM, Bajaj Nagar, Pune", "09:00", "09:15", true),
      makeStop("STP-018", "RTE-006", 2, "Pimpri MIDC Gate", "Pimpri Industrial Area, Pune", "09:45", "10:00"),
      makeStop("STP-019", "RTE-006", 3, "Chinchwad Industry Hub", "Chinchwad, Pune", "10:15", "10:30"),
      makeStop("STP-020", "RTE-006", 4, "VAMNICOM Main Gate (Return)", "VAMNICOM, Bajaj Nagar, Pune", "16:30", "17:00"),
    ],
  },
  {
    id: "RTE-007",
    name: "Hostel – Training Hall (Morning Shuttle)",
    institutionId: DEMO_INSTITUTION_ID,
    campusId: DEMO_CAMPUS_ID,
    description: "Morning shuttle from hostel to training hall",
    stops: [
      makeStop("STP-021", "RTE-007", 1, "Men's Hostel Main Gate", "Hostel Block A, VAMNICOM Campus", "08:00", "08:10", true),
      makeStop("STP-022", "RTE-007", 2, "Women's Hostel Gate", "Hostel Block B, VAMNICOM Campus", "08:12", "08:20", true),
      makeStop("STP-023", "RTE-007", 3, "VAMNICOM Training Hall", "VAMNICOM Main Building, Pune", "08:30", "08:40"),
    ],
  },
  {
    id: "RTE-008",
    name: "VAMNICOM – Nashik PACS Visit",
    institutionId: DEMO_INSTITUTION_ID,
    campusId: DEMO_CAMPUS_ID,
    description: "Visit to Primary Agricultural Credit Societies in Nashik district",
    stops: [
      makeStop("STP-024", "RTE-008", 1, "VAMNICOM Main Gate", "VAMNICOM, Bajaj Nagar, Pune", "06:30", "06:45"),
      makeStop("STP-025", "RTE-008", 2, "Nashik Phata", "Nashik Phata, Pune", "07:15", "07:25"),
      makeStop("STP-026", "RTE-008", 3, "Nashik PACS Office", "Nashik City, Maharashtra", "09:00", "09:15"),
    ],
  },
  {
    id: "RTE-009",
    name: "Kolhapur Station – VAMNICOM (One-off)",
    institutionId: DEMO_INSTITUTION_ID,
    campusId: DEMO_CAMPUS_ID,
    description: "One-off pickup from Kolhapur for outstation group",
    stops: [
      makeStop("STP-027", "RTE-009", 1, "Kolhapur Railway Station", "Station Rd, Kolhapur", "05:00", "05:30", true),
      makeStop("STP-028", "RTE-009", 2, "Kolhapur Bus Stand", "Mahadwar Rd, Kolhapur", "05:35", "05:45"),
      makeStop("STP-029", "RTE-009", 3, "Karad Bypass", "Karad, Maharashtra", "07:00", "07:10"),
      makeStop("STP-030", "RTE-009", 4, "VAMNICOM Main Gate", "VAMNICOM, Bajaj Nagar, Pune", "09:30", "09:45"),
    ],
  },
  {
    id: "RTE-010",
    name: "VAMNICOM – Graduation Venue",
    institutionId: DEMO_INSTITUTION_ID,
    campusId: DEMO_CAMPUS_ID,
    description: "Graduation ceremony transport to Balgandharva Rangmandir",
    stops: [
      makeStop("STP-031", "RTE-010", 1, "Men's Hostel Main Gate", "Hostel Block A, VAMNICOM", "09:00", "09:10", true),
      makeStop("STP-032", "RTE-010", 2, "Women's Hostel Gate", "Hostel Block B, VAMNICOM", "09:12", "09:20", true),
      makeStop("STP-033", "RTE-010", 3, "VAMNICOM Faculty Quarters", "Faculty Area, VAMNICOM", "09:25", "09:35"),
      makeStop("STP-034", "RTE-010", 4, "Balgandharva Rangmandir", "Jangli Maharaj Rd, Pune", "10:00", "10:15", true),
      makeStop("STP-035", "RTE-010", 5, "VAMNICOM Main Gate (Return)", "VAMNICOM, Bajaj Nagar, Pune", "14:30", "15:00"),
    ],
  },
];

// ---------------------------------------------------------------------------
// Transport Plans  (40 plans)
// ---------------------------------------------------------------------------
const makePlan = (
  n: number,
  overrides: Partial<TransportPlan> = {},
): TransportPlan => {
  const id = `PLN-${String(n).padStart(3, "0")}`;
  return {
    id,
    institutionId: DEMO_INSTITUTION_ID,
    campusId: DEMO_CAMPUS_ID,
    title: `Transport Plan ${n}`,
    linkedType: "programme",
    linkedId: PROGRAMMES[(n - 1) % PROGRAMMES.length].id,
    linkedLabel: PROGRAMMES[(n - 1) % PROGRAMMES.length].title,
    serviceDate: `2026-10-${String((n % 28) + 1).padStart(2, "0")}`,
    transportType: "Pickup",
    origin: "Pune Railway Station",
    destination: "VAMNICOM Campus",
    passengerEstimate: 20 + (n % 20),
    coordinatorId: "COORD-001",
    coordinatorName: "Sanjay Kulkarni",
    status: "Draft",
    hasReturnTrip: n % 3 === 0,
    accessibilityNeeds: n % 5 === 0,
    specialInstructions: "",
    costCentre: `CC-${String(n % 5 + 1).padStart(2, "0")}`,
    vendorId: n % 4 === 0 ? "VND-001" : null,
    internalNotes: "",
    createdAt: "2026-09-15T10:00:00+05:30",
    updatedAt: "2026-09-20T14:30:00+05:30",
    needsReviewReason: null,
    ...overrides,
  };
};

export const TRANSPORT_PLANS: TransportPlan[] = [
  // Phase-1 named plans
  makePlan(1, { title: "CMF Batch A – Arrival Pickup", status: "Published", linkedId: "PRG-001", linkedLabel: "Cooperative Management Fundamentals", serviceDate: "2026-10-03", origin: "Pune Railway Station", destination: "VAMNICOM Campus" }),
  makePlan(2, { title: "DCO Site Visit – Anand Dairy", status: "Published", linkedId: "PRG-003", linkedLabel: "Dairy Cooperative Operations", serviceDate: "2026-10-05", transportType: "Event Transport", origin: "VAMNICOM Campus", destination: "Anand Dairy Cooperative" }),
  makePlan(3, { title: "ACC Certification Exam Transport", status: "Approved", linkedId: "PRG-006", linkedLabel: "Accounting Certification", linkedType: "exam", serviceDate: "2026-10-10", transportType: "Exam Transport", origin: "VAMNICOM Campus", destination: "Kothrud Exam Centre" }),
  makePlan(4, { title: "PACS Digital Accounting – Airport Pickup", status: "Published", linkedId: "PRG-004", linkedLabel: "PACS Digital Accounting", serviceDate: "2026-10-07", transportType: "Station Pickup", origin: "Pune Airport", destination: "VAMNICOM Campus" }),
  makePlan(5, { title: "CBK Batch B – Return Drop", status: "Completed", linkedId: "PRG-002", linkedLabel: "Cooperative Bookkeeping", serviceDate: "2026-09-30", transportType: "Drop", origin: "VAMNICOM Campus", destination: "Pune Railway Station" }),
  // Needs Review plan (linked event changed)
  makePlan(6, { title: "RBM Industry Tour – NEEDS REVIEW", status: "Needs Review", linkedId: "PRG-009", linkedLabel: "Rural Business Management", serviceDate: "2026-10-08", transportType: "Event Transport", needsReviewReason: "Timetable session date changed from Oct 8 to Oct 12. Re-confirm vehicle and driver availability." }),
  // Capacity conflict plan (passenger estimate > vehicle capacity — 40 passengers, only 22-seat bus assigned)
  makePlan(7, { title: "HCE Graduation Transport – CAPACITY CONFLICT", status: "Approved", linkedId: "PRG-007", linkedLabel: "Handloom & Handicraft Cooperative Enterprise", serviceDate: "2026-10-15", passengerEstimate: 40, transportType: "Event Transport", origin: "VAMNICOM Campus", destination: "Balgandharva Rangmandir" }),
  makePlan(8, { title: "CMF Batch B – Session Pickup", status: "Draft", linkedId: "PRG-001", linkedLabel: "Cooperative Management Fundamentals", serviceDate: "2026-10-12" }),
  makePlan(9, { title: "Dairy Adv – Airport Pickup", status: "Published", linkedId: "PRG-012", linkedLabel: "Advanced Dairy Technology", serviceDate: "2026-10-04", transportType: "Station Pickup", origin: "Pune Airport", destination: "VAMNICOM Campus" }),
  makePlan(10, { title: "Fish Coop – Nashik PACS Visit", status: "Published", linkedId: "PRG-011", linkedLabel: "Fisheries Cooperative Management", serviceDate: "2026-10-06", transportType: "Event Transport", origin: "VAMNICOM Campus", destination: "Nashik PACS Office" }),
  // Plans 11-40 (generic, various statuses)
  makePlan(11, { status: "Published" }),
  makePlan(12, { status: "Published" }),
  makePlan(13, { status: "Approved" }),
  makePlan(14, { status: "Draft" }),
  makePlan(15, { status: "Published" }),
  makePlan(16, { status: "Completed" }),
  makePlan(17, { status: "Published" }),
  makePlan(18, { status: "Cancelled" }),
  makePlan(19, { status: "Draft" }),
  makePlan(20, { status: "Published" }),
  makePlan(21, { status: "Pending Approval" }),
  makePlan(22, { status: "Published" }),
  makePlan(23, { status: "Completed" }),
  makePlan(24, { status: "Approved" }),
  makePlan(25, { status: "Draft" }),
  makePlan(26, { status: "Published" }),
  makePlan(27, { status: "Published" }),
  makePlan(28, { status: "Completed" }),
  makePlan(29, { status: "Cancelled" }),
  makePlan(30, { status: "Published" }),
  makePlan(31, { status: "Draft" }),
  makePlan(32, { status: "Approved" }),
  makePlan(33, { status: "Published" }),
  makePlan(34, { status: "Draft" }),
  makePlan(35, { status: "Pending Approval" }),
  makePlan(36, { status: "Published" }),
  makePlan(37, { status: "Completed" }),
  makePlan(38, { status: "Published" }),
  makePlan(39, { status: "Draft" }),
  makePlan(40, { status: "Published" }),
];

// ---------------------------------------------------------------------------
// Trips  (75 trips; named trips TRP-2026-0142 through TRP-2026-0146)
// ---------------------------------------------------------------------------
const makeTrip = (n: number, overrides: Partial<Trip> = {}): Trip => ({
  id: `TRP-${String(n).padStart(3, "0")}`,
  planId: TRANSPORT_PLANS[(n - 1) % TRANSPORT_PLANS.length].id,
  tripCode: `TRP-2026-${String(n).padStart(4, "0")}`,
  departureTime: `2026-10-${String((n % 28) + 1).padStart(2, "0")}T08:30:00+05:30`,
  arrivalTime: `2026-10-${String((n % 28) + 1).padStart(2, "0")}T09:30:00+05:30`,
  origin: "Pune Railway Station",
  destination: "VAMNICOM Campus",
  routeId: `RTE-${String((n % 10) + 1).padStart(3, "0")}`,
  vehicleId: `VEH-${String((n % 14) + 1).padStart(3, "0")}`,
  driverId: `DRV-${String((n % 18) + 1).padStart(3, "0")}`,
  coordinatorId: "COORD-001",
  coordinatorName: "Sanjay Kulkarni",
  seatingCapacity: 22,
  assignedPassengers: 15,
  status: "Assigned",
  delayMinutes: null,
  confirmedEta: null,
  institutionId: DEMO_INSTITUTION_ID,
  campusId: DEMO_CAMPUS_ID,
  isReturnTrip: false,
  createdAt: "2026-09-20T10:00:00+05:30",
  updatedAt: "2026-09-22T14:30:00+05:30",
  ...overrides,
});

export const TRIPS: Trip[] = [
  // Generic trips 1–141
  ...Array.from({ length: 141 }, (_, i) => makeTrip(i + 1, {
    status: (["Assigned", "Departed", "Completed", "Cancelled", "Ready"] as const)[(i % 5)],
    vehicleId: `VEH-${String((i % 14) + 1).padStart(3, "0")}`,
    driverId: `DRV-${String((i % 18) + 1).padStart(3, "0")}`,
  })),
  // ---- Named trips per spec §11 ----
  // TRP-2026-0142: 22-seat bus, D-008, 18/22, Published
  makeTrip(142, {
    tripCode: "TRP-2026-0142",
    planId: "PLN-001",
    vehicleId: "VEH-008",
    driverId: "DRV-008",
    seatingCapacity: 22,
    assignedPassengers: 18,
    status: "Ready",
    departureTime: "2026-10-03T08:30:00+05:30",
    arrivalTime: "2026-10-03T09:30:00+05:30",
    routeId: "RTE-001",
    origin: "Pune Railway Station",
    destination: "VAMNICOM Campus",
  }),
  // TRP-2026-0143: 12-seat van, D-014, 9/12, Assigned
  makeTrip(143, {
    tripCode: "TRP-2026-0143",
    planId: "PLN-004",
    vehicleId: "VEH-002",
    driverId: "DRV-014",
    seatingCapacity: 12,
    assignedPassengers: 9,
    status: "Assigned",
    departureTime: "2026-10-07T06:00:00+05:30",
    arrivalTime: "2026-10-07T07:15:00+05:30",
    routeId: "RTE-003",
    origin: "Pune Airport",
    destination: "VAMNICOM Campus",
  }),
  // TRP-2026-0144: 40-seat bus unassigned, Needs Assignment
  makeTrip(144, {
    tripCode: "TRP-2026-0144",
    planId: "PLN-003",
    vehicleId: null,
    driverId: null,
    seatingCapacity: 40,
    assignedPassengers: 35,
    status: "Unassigned",
    departureTime: "2026-10-10T08:00:00+05:30",
    arrivalTime: "2026-10-10T09:00:00+05:30",
    routeId: "RTE-004",
    origin: "VAMNICOM Campus",
    destination: "Kothrud Exam Centre",
  }),
  // TRP-2026-0145: 22-seat bus, 17:30, Delayed
  makeTrip(145, {
    tripCode: "TRP-2026-0145",
    planId: "PLN-002",
    vehicleId: "VEH-007",
    driverId: "DRV-005",
    seatingCapacity: 22,
    assignedPassengers: 19,
    status: "Delayed",
    delayMinutes: 45,
    confirmedEta: "2026-10-05T18:15:00+05:30",
    departureTime: "2026-10-05T17:30:00+05:30",
    arrivalTime: "2026-10-05T20:00:00+05:30",
    routeId: "RTE-002",
    origin: "VAMNICOM Campus",
    destination: "Anand Dairy Cooperative",
  }),
  // TRP-2026-0146: Van V-006, D-003, Incident Reported
  makeTrip(146, {
    tripCode: "TRP-2026-0146",
    planId: "PLN-010",
    vehicleId: "VEH-006",
    driverId: "DRV-003",
    seatingCapacity: 12,
    assignedPassengers: 10,
    status: "Incident",
    departureTime: "2026-10-06T09:00:00+05:30",
    arrivalTime: "2026-10-06T12:00:00+05:30",
    routeId: "RTE-008",
    origin: "VAMNICOM Campus",
    destination: "Nashik PACS Office",
  }),
  // Driver overlap conflict: DRV-009 assigned to two trips at the same time
  makeTrip(147, {
    tripCode: "TRP-2026-0147",
    planId: "PLN-011",
    vehicleId: "VEH-009",
    driverId: "DRV-009", // same driver as trip 148 – overlap conflict
    seatingCapacity: 22,
    assignedPassengers: 18,
    status: "Assigned",
    departureTime: "2026-10-12T08:00:00+05:30",
    arrivalTime: "2026-10-12T09:00:00+05:30",
    routeId: "RTE-001",
  }),
  makeTrip(148, {
    tripCode: "TRP-2026-0148",
    planId: "PLN-012",
    vehicleId: "VEH-013",
    driverId: "DRV-009", // overlap — same driver, same time as 147
    seatingCapacity: 22,
    assignedPassengers: 14,
    status: "Assigned",
    departureTime: "2026-10-12T07:45:00+05:30",
    arrivalTime: "2026-10-12T08:45:00+05:30",
    routeId: "RTE-007",
  }),
  // Capacity conflict trip: plan says 40 passengers, vehicle only 22 seats
  makeTrip(149, {
    tripCode: "TRP-2026-0149",
    planId: "PLN-007", // capacity conflict plan
    vehicleId: "VEH-008", // 22-seat minibus, but 40 passengers expected
    driverId: "DRV-007",
    seatingCapacity: 22,
    assignedPassengers: 22,
    status: "Assigned",
    departureTime: "2026-10-15T09:00:00+05:30",
    arrivalTime: "2026-10-15T10:00:00+05:30",
    routeId: "RTE-010",
    origin: "VAMNICOM Campus",
    destination: "Balgandharva Rangmandir",
  }),
];

// ---------------------------------------------------------------------------
// Passenger Assignments  (600 total — generated)
// ---------------------------------------------------------------------------
const traineeNames = [
  "Anita Sharma", "Rajesh Gupta", "Priya Patel", "Amit Singh", "Sunita Yadav",
  "Vijay Kumar", "Meena Nair", "Suresh Reddy", "Kavita Joshi", "Ramesh Tiwari",
  "Deepa Menon", "Ashok Rao", "Sita Devi", "Manoj Pandey", "Geeta Pillai",
  "Harish Varma", "Lakshmi Iyer", "Sunil Desai", "Pooja Agarwal", "Naresh Verma",
  "Rekha Bhat", "Dinesh Nambiar", "Usha Krishnan", "Satish Choudhary", "Anjali Mehta",
];

export const PASSENGER_ASSIGNMENTS: PassengerAssignment[] = Array.from(
  { length: 600 },
  (_, i): PassengerAssignment => {
    const tripIdx = i % TRIPS.length;
    const trip = TRIPS[tripIdx];
    const traineeIdx = i % traineeNames.length;
    const stopIdx = i % 4;
    const statuses: PassengerStatus[] = ["Expected", "Confirmed", "Boarded", "Dropped off", "No-show", "Cancelled", "Exception"];
    return {
      id: `PA-${String(i + 1).padStart(4, "0")}`,
      tripId: trip.id,
      traineeId: `TRN-${String(1000 + i).padStart(5, "0")}`,
      traineeName: traineeNames[traineeIdx],
      traineeCode: `TC-${String(2026000 + i)}`,
      programmeId: PROGRAMMES[(i % PROGRAMMES.length)].id,
      programmeTitle: PROGRAMMES[(i % PROGRAMMES.length)].title,
      batchId: BATCHES[(i % BATCHES.length)].id,
      batchCode: BATCHES[(i % BATCHES.length)].code,
      pickupStopId: `STP-${String(stopIdx + 1).padStart(3, "0")}`,
      pickupStopName: ROUTES[0].stops[stopIdx % ROUTES[0].stops.length].locationName,
      status: statuses[(i % statuses.length)],
      boardedAt: i % 3 === 0 ? "2026-10-03T08:35:00+05:30" : null,
      droppedAt: i % 5 === 0 ? "2026-10-03T09:25:00+05:30" : null,
      permittedContactMethod: "email",
    };
  },
);

// ---------------------------------------------------------------------------
// Transport Requests (25)
// ---------------------------------------------------------------------------
const requestStatuses: TransportRequest["approvalStatus"][] = [
  "Submitted", "Under Review", "Approved", "Rejected", "More Info Required",
  "Draft", "Withdrawn",
];
export const TRANSPORT_REQUESTS: TransportRequest[] = Array.from(
  { length: 25 },
  (_, i): TransportRequest => ({
    id: `REQ-${String(i + 1).padStart(3, "0")}`,
    requestCode: `TR-2026-${String(100 + i).padStart(4, "0")}`,
    requesterId: `TRN-${String(2000 + i)}`,
    requesterName: traineeNames[i % traineeNames.length],
    requesterRole: i % 5 === 0 ? "trainer" : "institution",
    eventId: `EVT-${String(i + 1).padStart(3, "0")}`,
    eventLabel: PROGRAMMES[(i % PROGRAMMES.length)].title,
    requestedDate: `2026-10-${String((i % 28) + 1).padStart(2, "0")}`,
    departureTime: "09:00",
    origin: "VAMNICOM Campus",
    destination: "Pune City",
    passengerEstimate: 10 + (i % 15),
    reason: "Field visit required for programme curriculum.",
    accessibilityNeeds: i % 7 === 0,
    notes: "",
    approvalStatus: requestStatuses[i % requestStatuses.length],
    decisionNote: i % 3 === 0 ? "Approved. Vehicle confirmed." : "",
    decidedBy: i % 3 === 0 ? "Sanjay Kulkarni" : null,
    decidedAt: i % 3 === 0 ? "2026-09-25T11:00:00+05:30" : null,
    linkedPlanId: i % 3 === 0 ? TRANSPORT_PLANS[i % TRANSPORT_PLANS.length].id : null,
    createdAt: `2026-09-${String((i % 28) + 1).padStart(2, "0")}T10:00:00+05:30`,
    updatedAt: `2026-09-${String((i % 28) + 1).padStart(2, "0")}T10:00:00+05:30`,
    institutionId: DEMO_INSTITUTION_ID,
  }),
);

// ---------------------------------------------------------------------------
// Incidents (12)
// ---------------------------------------------------------------------------
const incidentCategories: Incident["category"][] = [
  "Vehicle Breakdown", "Driver Issue", "Passenger Issue", "Route Obstruction",
  "Medical", "Delay", "Safety", "Other",
];
const incidentSeverities: Incident["severity"][] = ["Low", "Medium", "High", "Critical"];
const incidentStatuses: Incident["status"][] = [
  "Open", "Assigned", "In Progress", "Resolved", "Closed",
];

export const INCIDENTS: Incident[] = [
  // Incident on TRP-2026-0146
  {
    id: "INC-001",
    incidentCode: "INC-2026-001",
    tripId: TRIPS.find(t => t.tripCode === "TRP-2026-0146")?.id ?? "TRP-146",
    tripCode: "TRP-2026-0146",
    category: "Vehicle Breakdown",
    severity: "High",
    reporterName: "Mahesh Kamble",
    reporterRole: "Driver",
    ownerName: "Sanjay Kulkarni",
    description: "Vehicle tyre burst on Nashik Highway near Igatpuri. Passengers safe. Replacement arranged.",
    locationDescription: "NH-3 near Igatpuri, Maharashtra",
    occurredAt: "2026-10-06T10:15:00+05:30",
    status: "In Progress",
    actionLog: [
      { id: "ACT-001", timestamp: "2026-10-06T10:20:00+05:30", actor: "Sanjay Kulkarni", note: "Acknowledged. Sending replacement vehicle VEH-011." },
      { id: "ACT-002", timestamp: "2026-10-06T11:00:00+05:30", actor: "Mahesh Kamble", note: "Replacement vehicle arrived. Passengers transferred." },
    ],
    resolutionSummary: null,
    resolvedAt: null,
    closedAt: null,
    institutionId: DEMO_INSTITUTION_ID,
  },
  // Incident on TRP-2026-0145 (Delayed)
  {
    id: "INC-002",
    incidentCode: "INC-2026-002",
    tripId: TRIPS.find(t => t.tripCode === "TRP-2026-0145")?.id ?? "TRP-145",
    tripCode: "TRP-2026-0145",
    category: "Delay",
    severity: "Medium",
    reporterName: "Ganesh More",
    reporterRole: "Driver",
    ownerName: "Sanjay Kulkarni",
    description: "Heavy traffic on Pune-Nashik highway caused 45-minute delay.",
    locationDescription: "Pune-Nashik Highway NH-60",
    occurredAt: "2026-10-05T18:00:00+05:30",
    status: "Resolved",
    actionLog: [
      { id: "ACT-003", timestamp: "2026-10-05T18:05:00+05:30", actor: "Sanjay Kulkarni", note: "Notified trainer. Updated ETA to 18:15." },
    ],
    resolutionSummary: "Traffic cleared. Arrived at destination at 18:20.",
    resolvedAt: "2026-10-05T18:25:00+05:30",
    closedAt: null,
    institutionId: DEMO_INSTITUTION_ID,
  },
  // 10 more generic incidents
  ...Array.from({ length: 10 }, (_, i): Incident => ({
    id: `INC-${String(i + 3).padStart(3, "0")}`,
    incidentCode: `INC-2026-${String(i + 3).padStart(3, "0")}`,
    tripId: TRIPS[(i * 7) % TRIPS.length].id,
    tripCode: TRIPS[(i * 7) % TRIPS.length].tripCode,
    category: incidentCategories[i % incidentCategories.length],
    severity: incidentSeverities[i % incidentSeverities.length],
    reporterName: traineeNames[i % traineeNames.length],
    reporterRole: i % 2 === 0 ? "Driver" : "Coordinator",
    ownerName: "Sanjay Kulkarni",
    description: `Incident ${i + 3} on trip. Reported by driver.`,
    locationDescription: "On route",
    occurredAt: `2026-10-0${(i % 5) + 1}T${String(8 + i).padStart(2, "0")}:00:00+05:30`,
    status: incidentStatuses[i % incidentStatuses.length],
    actionLog: [],
    resolutionSummary: i % 3 === 0 ? "Resolved after 2 hours." : null,
    resolvedAt: i % 3 === 0 ? "2026-10-03T12:00:00+05:30" : null,
    closedAt: i % 5 === 0 ? "2026-10-03T14:00:00+05:30" : null,
    institutionId: DEMO_INSTITUTION_ID,
  })),
];

// ---------------------------------------------------------------------------
// Expenses (50)
// ---------------------------------------------------------------------------
const expenseCategories: TripExpense["category"][] = [
  "Hire", "Fuel", "Toll", "Parking", "Allowance", "Repair", "Other",
];
export const EXPENSES: TripExpense[] = Array.from(
  { length: 50 },
  (_, i): TripExpense => ({
    id: `EXP-${String(i + 1).padStart(3, "0")}`,
    tripId: TRIPS[(i * 3) % TRIPS.length].id,
    planId: TRANSPORT_PLANS[(i * 3) % TRANSPORT_PLANS.length].id,
    category: expenseCategories[i % expenseCategories.length],
    amountInr: 500 + (i * 250) + (i % 7) * 100,
    vendorName: i % 3 === 0 ? "Sahyadri Travel Co." : i % 3 === 1 ? "Indian Oil" : "MSRDC",
    receiptRef: `RCP-${String(2026000 + i)}`,
    payerName: "Sanjay Kulkarni",
    approvalStatus: (["Pending", "Approved", "Rejected"] as const)[i % 3],
    recordedAt: `2026-10-0${(i % 5) + 1}T10:00:00+05:30`,
    approvedBy: i % 3 === 1 ? "Finance Officer" : null,
    institutionId: DEMO_INSTITUTION_ID,
  }),
);

// ---------------------------------------------------------------------------
// Default Audit Events
// ---------------------------------------------------------------------------
export const DEFAULT_AUDIT_LOG: AuditEvent[] = [
  {
    id: "AUD-001",
    entityType: "TransportPlan",
    entityId: "PLN-2026-0001",
    actor: "Admin (VAMNICOM)",
    actorRole: "Logistics Officer",
    action: "PLAN_APPROVED",
    before: { status: "Draft" },
    after: { status: "Approved" },
    reason: "Vehicle capacity and driver shifts verified for dairy field visit.",
    createdAt: "2026-10-02T14:30:00+05:30",
    institutionId: DEMO_INSTITUTION_ID,
  },
  {
    id: "AUD-002",
    entityType: "Trip",
    entityId: "TRP-2026-0142",
    actor: "Rajendra More",
    actorRole: "Fleet Supervisor",
    action: "VEHICLE_ASSIGNED",
    before: { vehicleId: null },
    after: { vehicleId: "VEH-001" },
    reason: "Assigned 40-seater BharatBenz coach for batch CMF-01.",
    createdAt: "2026-10-02T16:15:00+05:30",
    institutionId: DEMO_INSTITUTION_ID,
  },
  {
    id: "AUD-003",
    entityType: "Trip",
    entityId: "TRP-2026-0143",
    actor: "Suresh Patil",
    actorRole: "Driver",
    action: "TRIP_STARTED",
    before: { status: "Scheduled" },
    after: { status: "In-Transit" },
    reason: "Departed Pune Railway Station with 36 trainees on board.",
    createdAt: "2026-10-03T08:10:00+05:30",
    institutionId: DEMO_INSTITUTION_ID,
  },
  {
    id: "AUD-004",
    entityType: "Incident",
    entityId: "INC-001",
    actor: "Suresh Patil",
    actorRole: "Driver",
    action: "INCIDENT_LOGGED",
    before: null,
    after: { severity: "Low", category: "Traffic" },
    reason: "15 min delay due to highway maintenance near Hadapsar bypass.",
    createdAt: "2026-10-03T08:45:00+05:30",
    institutionId: DEMO_INSTITUTION_ID,
  },
  {
    id: "AUD-005",
    entityType: "TripExpense",
    entityId: "EXP-001",
    actor: "Finance Officer",
    actorRole: "Accounts",
    action: "EXPENSE_APPROVED",
    before: { approvalStatus: "Pending" },
    after: { approvalStatus: "Approved" },
    reason: "Toll receipt and fuel voucher verified against vehicle log.",
    createdAt: "2026-10-03T11:20:00+05:30",
    institutionId: DEMO_INSTITUTION_ID,
  },
];
