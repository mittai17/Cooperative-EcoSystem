import type {
  Hostel,
  HostelBlock,
  Room,
  Bed,
  TraineeProfile,
  HostelRequest,
  HostelAllocation,
  CheckRecord,
  HostelAttendanceRecord,
  MaintenanceIssue,
  HostelNotice,
  HostelFacility,
  HostelStats,
  RoomType,
  RoomStatus,
  BedStatus,
} from "./types";

// Deterministic Pseudo-Random Number Generator (Mulberry32)
function createPRNG(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const prng = createPRNG(26087);

const INDIAN_FIRST_NAMES = [
  "Ravindra", "Sunita", "Ramesh", "Pooja", "Amit", "Priya", "Vikram", "Neha",
  "Anjali", "Deepak", "Farida", "Meena", "Suresh", "Kavita", "Rahul", "Arjun",
  "Sneha", "Mohit", "Shweta", "Nitin", "Rajesh", "Gaurav", "Anita", "Vikas",
  "Pankaj", "Jyoti", "Manish", "Preeti", "Sanjay", "Rekha", "Abhishek", "Ritu",
  "Manoj", "Komal", "Sachin", "Divya", "Alok", "Pallavi", "Sunil", "Aarti"
];

const INDIAN_LAST_NAMES = [
  "Patil", "Sharma", "Kumar", "Gupta", "Nair", "Solanki", "Singh", "Rathore",
  "Chauhan", "Khaton", "Patel", "Yadav", "Joshi", "Verma", "Kulkarni", "Pawar",
  "Deshmukh", "Jadhav", "Shinde", "Bhosale", "Mishra", "Pandey", "Choudhury",
  "Reddy", "Rao", "Gowda", "Menon", "Pillai", "Das", "Banerjee", "Bose",
  "Chatterjee", "Sen", "Bhattacharya", "Dutta", "Mukherjee", "Thakur", "Sinha"
];

const PROGRAMMES_DATA = [
  { name: "PACS Digital Accounting", code: "PDA", batches: ["PDA-01", "PDA-02", "PDA-03"] },
  { name: "Cooperative Management Fundamentals", code: "CMF", batches: ["CMF-01", "CMF-02", "CMF-03"] },
  { name: "Dairy Cooperative Operations", code: "DCO", batches: ["DCO-01", "DCO-02"] },
  { name: "Cooperative Law & Governance", code: "CLG", batches: ["CLG-01", "CLG-02"] },
  { name: "FPO Management & Operations", code: "FPO", batches: ["FPO-01", "FPO-02"] },
  { name: "Women SHG Leadership", code: "SHG", batches: ["SHG-01", "SHG-02"] },
  { name: "Digital Literacy for Cooperatives", code: "DL", batches: ["DL-01", "DL-02"] },
  { name: "Rural Entrepreneurship", code: "RCE", batches: ["RCE-01", "RCE-02"] },
];

export const INITIAL_HOSTELS: Hostel[] = [
  {
    id: "h-1",
    code: "VAM-H01",
    name: "VAMNICOM Main Hostel",
    location: "Pune, Maharashtra",
    gender: "Mixed",
    blocksCount: 4,
    roomsCount: 96,
    bedsCount: 320,
    occupiedBeds: 312,
    availableBeds: 8,
    reservedBeds: 0,
    maintenanceBeds: 0,
    occupancyRate: 74,
    wardenName: "Mr. S. Deshmukh",
    wardenPhone: "+91 98765 43210",
    wardenEmail: "warden.main@vamnicom.org",
    photoUrl: "/vamnicom-campus.jpg",
    status: "Active",
    description: "Primary residential hostel for senior cooperative delegates, trainees, and executives.",
  },
  {
    id: "h-2",
    code: "VAM-H02",
    name: "Women's Hostel",
    location: "Pune, Maharashtra",
    gender: "Female",
    blocksCount: 2,
    roomsCount: 36,
    bedsCount: 120,
    occupiedBeds: 96,
    availableBeds: 24,
    reservedBeds: 0,
    maintenanceBeds: 0,
    occupancyRate: 80,
    wardenName: "Dr. Pratibha Shinde",
    wardenPhone: "+91 98221 54321",
    wardenEmail: "warden.women@vamnicom.org",
    photoUrl: "/vamnicom-campus.jpg",
    status: "Active",
    description: "Dedicated safe and secure accommodation for women trainees and researchers.",
  },
  {
    id: "h-3",
    code: "VAM-H03",
    name: "Training Residential Hostel",
    location: "Pune, Maharashtra",
    gender: "Mixed",
    blocksCount: 2,
    roomsCount: 28,
    bedsCount: 96,
    occupiedBeds: 30,
    availableBeds: 50,
    reservedBeds: 12,
    maintenanceBeds: 4,
    occupancyRate: 60,
    wardenName: "Mr. Ramesh Kulkarni",
    wardenPhone: "+91 98223 67890",
    wardenEmail: "warden.res@vamnicom.org",
    photoUrl: "/vamnicom-campus.jpg",
    status: "Active",
    description: "Short-term residential training quarters with smart study zones and breakout rooms.",
  },
  {
    id: "h-4",
    code: "VAM-H04",
    name: "Guest & Faculty Hostel",
    location: "Pune, Maharashtra",
    gender: "Mixed",
    blocksCount: 1,
    roomsCount: 12,
    bedsCount: 40,
    occupiedBeds: 34,
    availableBeds: 16,
    reservedBeds: 6,
    maintenanceBeds: 4,
    occupancyRate: 68,
    wardenName: "Mr. Nitin Joshi",
    wardenPhone: "+91 98225 11223",
    wardenEmail: "warden.guest@vamnicom.org",
    photoUrl: "/vamnicom-campus.jpg",
    status: "Active",
    description: "Executive accommodation for visiting resource persons, state registrars, and faculty.",
  },
  {
    id: "h-5",
    code: "VAM-H05",
    name: "Overflow Training Accommodation",
    location: "Pune, Maharashtra",
    gender: "Mixed",
    blocksCount: 2,
    roomsCount: 20,
    bedsCount: 64,
    occupiedBeds: 0,
    availableBeds: 64,
    reservedBeds: 0,
    maintenanceBeds: 0,
    occupancyRate: 0,
    wardenName: "Mr. Sunil Pawar",
    wardenPhone: "+91 98229 99887",
    wardenEmail: "warden.overflow@vamnicom.org",
    photoUrl: "/vamnicom-campus.jpg",
    status: "Partially Occupied",
    description: "Contingency and seasonal peak intake accommodation facility.",
  },
];

export const INITIAL_BLOCKS: HostelBlock[] = [
  {
    id: "blk-a",
    hostelId: "h-1",
    name: "Block A (Academic Block)",
    code: "BLK-A",
    floorCount: 4,
    roomsCount: 40,
    bedsCount: 160,
    occupiedBeds: 120,
    availableBeds: 40,
    occupancyRate: 75,
    gender: "Mixed",
    wardenName: "Mr. S. Deshmukh",
    wardenPhone: "+91 98765 43210",
    status: "ACTIVE",
  },
  {
    id: "blk-b",
    hostelId: "h-1",
    name: "Block B (East Wing)",
    code: "BLK-B",
    floorCount: 4,
    roomsCount: 35,
    bedsCount: 140,
    occupiedBeds: 104,
    availableBeds: 36,
    occupancyRate: 74,
    gender: "Mixed",
    wardenName: "Mr. S. Deshmukh",
    wardenPhone: "+91 98765 43210",
    status: "ACTIVE",
  },
  {
    id: "blk-c",
    hostelId: "h-1",
    name: "Block C (West Wing)",
    code: "BLK-C",
    floorCount: 3,
    roomsCount: 30,
    bedsCount: 120,
    occupiedBeds: 92,
    availableBeds: 28,
    occupancyRate: 77,
    gender: "Mixed",
    wardenName: "Mr. Suresh Jadhav",
    wardenPhone: "+91 98220 14820",
    status: "ACTIVE",
  },
  {
    id: "blk-d",
    hostelId: "h-1",
    name: "Block D (Garden View)",
    code: "BLK-D",
    floorCount: 3,
    roomsCount: 28,
    bedsCount: 110,
    occupiedBeds: 86,
    availableBeds: 24,
    occupancyRate: 78,
    gender: "Mixed",
    wardenName: "Dr. Anand Deshmukh",
    wardenPhone: "+91 98224 88712",
    status: "ACTIVE",
  },
  {
    id: "blk-e",
    hostelId: "h-2",
    name: "Block E (Women's Wing A)",
    code: "BLK-E",
    floorCount: 3,
    roomsCount: 28,
    bedsCount: 110,
    occupiedBeds: 70,
    availableBeds: 40,
    occupancyRate: 64,
    gender: "Female",
    wardenName: "Dr. Pratibha Shinde",
    wardenPhone: "+91 98221 54321",
    status: "ACTIVE",
  },
];

// Target Demo Trainee: Ravindra Suresh Patil
export const DEMO_TRAINEE_RAVINDRA: TraineeProfile = {
  id: "trn-ravindra",
  traineeCode: "TRN-0315-042",
  fullName: "Ravindra Suresh Patil",
  gender: "Male",
  age: 28,
  phone: "+91 98220 98765",
  email: "ravindra.patil@coopsetu.ai",
  state: "Maharashtra",
  district: "Kolhapur",
  cooperative: "Kolhapur District Central Cooperative Bank",
  society: "Shirol Taluka PACS No. 4",
  programme: "PACS Digital Accounting",
  programmeCode: "PDA",
  batch: "PDA-02",
  trainingStart: "12 Oct 2026",
  trainingEnd: "25 Oct 2026",
  hostelRequired: true,
  hostelStatus: "Checked In",
  hostelId: "h-1",
  hostelName: "VAMNICOM Main Hostel",
  blockId: "blk-a",
  blockName: "Block A (Academic Block)",
  roomId: "rm-a204",
  roomNumber: "A-204",
  bedId: "bed-a204-02",
  bedNumber: "02",
  checkInStatus: "Checked In",
  checkInDate: "12 Oct 2026",
  expectedCheckout: "25 Oct 2026",
  actualCheckIn: "12 Oct 2026, 10:30 AM",
  idVerified: true,
  emergencyContact: "Suresh Patil (Father) — +91 94220 12345",
  specialRequirement: "Ground or 2nd floor preferred, non-AC",
  status: "Active",
};

// Target Room A-204
export const DEMO_ROOM_A204: Room = {
  id: "rm-a204",
  roomNumber: "A-204",
  hostelId: "h-1",
  hostelName: "VAMNICOM Main Hostel",
  blockId: "blk-a",
  blockName: "Block A",
  floor: 2,
  roomType: "4 Sharing",
  capacity: 4,
  occupied: 2,
  available: 2,
  gender: "Male",
  status: "Partially Occupied",
  ac: false,
  attachedBathroom: true,
  facilities: ["Wi-Fi", "Study Table", "Attached Bathroom", "Wardrobe", "Ceiling Fan", "Window"],
  distanceToHall: "Near Training Hall (200m)",
  beds: [
    {
      id: "bed-a204-01",
      roomId: "rm-a204",
      roomNumber: "A-204",
      bedNumber: "Bed 01",
      status: "OCCUPIED",
      traineeId: "trn-amit",
      traineeName: "Amit Gupta",
      allocationId: "alc-1044",
    },
    {
      id: "bed-a204-02",
      roomId: "rm-a204",
      roomNumber: "A-204",
      bedNumber: "Bed 02",
      status: "OCCUPIED",
      traineeId: "trn-ravindra",
      traineeName: "Ravindra Suresh Patil",
      allocationId: "alc-1042",
    },
    {
      id: "bed-a204-03",
      roomId: "rm-a204",
      roomNumber: "A-204",
      bedNumber: "Bed 03",
      status: "AVAILABLE",
    },
    {
      id: "bed-a204-04",
      roomId: "rm-a204",
      roomNumber: "A-204",
      bedNumber: "Bed 04",
      status: "AVAILABLE",
    },
  ],
  assignedTrainees: [
    { id: "trn-amit", name: "Amit Gupta", avatar: "AG", batch: "CLG-01", bedNumber: "01" },
    { id: "trn-ravindra", name: "Ravindra Suresh Patil", avatar: "RP", batch: "PDA-02", bedNumber: "02" },
  ],
};

// Seed-based generation for comprehensive ERP dataset
export function generateFullHostelDataset() {
  const trainees: TraineeProfile[] = [DEMO_TRAINEE_RAVINDRA];
  const rooms: Room[] = [DEMO_ROOM_A204];
  const beds: Bed[] = [...DEMO_ROOM_A204.beds];
  const allocations: HostelAllocation[] = [];
  const requests: HostelRequest[] = [];
  const checkRecords: CheckRecord[] = [];
  const attendanceRecords: HostelAttendanceRecord[] = [];
  const maintenanceIssues: MaintenanceIssue[] = [];
  const notices: HostelNotice[] = [];
  const facilities: HostelFacility[] = [];

  // Key Requests from Screenshot 1 & 2
  requests.push(
    {
      id: "req-1042",
      requestId: "HR-1042",
      traineeId: "trn-ravindra",
      traineeName: "Ravindra S. Patil",
      traineeCode: "TRN-0315-042",
      programme: "PACS Digital Accounting",
      batch: "PDA-02",
      gender: "Male",
      trainingStart: "12 Oct 2026",
      trainingEnd: "25 Oct 2026",
      requestedHostel: "VAMNICOM Main Hostel",
      requestedHostelId: "h-1",
      roomPreference: "4 Sharing",
      acPreference: false,
      specialRequirement: "Non-AC, Ground or 2nd floor",
      reason: "Official trainee sponsored by Kolhapur DCCB.",
      submittedDate: "10 Oct 2026",
      status: "Pending",
    },
    {
      id: "req-1043",
      requestId: "HR-1043",
      traineeId: "trn-sunita",
      traineeName: "Sunita Sharma",
      traineeCode: "TRN-0211-019",
      programme: "Dairy Cooperative Ops",
      batch: "DCO-01",
      gender: "Female",
      trainingStart: "15 Oct 2026",
      trainingEnd: "30 Oct 2026",
      requestedHostel: "Women's Hostel",
      requestedHostelId: "h-2",
      roomPreference: "4 Sharing",
      acPreference: false,
      specialRequirement: "Vegetarian mess proximity",
      reason: "Dairy federation nomination.",
      submittedDate: "10 Oct 2026",
      status: "Approved",
    },
    {
      id: "req-1044",
      requestId: "HR-1044",
      traineeId: "trn-amit",
      traineeName: "Amit Gupta",
      traineeCode: "TRN-0419-088",
      programme: "Cooperative Law",
      batch: "CLG-01",
      gender: "Male",
      trainingStart: "12 Oct 2026",
      trainingEnd: "24 Oct 2026",
      requestedHostel: "VAMNICOM Main Hostel",
      requestedHostelId: "h-1",
      roomPreference: "2 Sharing" as any,
      acPreference: false,
      specialRequirement: "Study table required",
      reason: "State legal cell advisor training.",
      submittedDate: "09 Oct 2026",
      status: "Under Review",
    },
    {
      id: "req-1045",
      requestId: "HR-1045",
      traineeId: "trn-priya",
      traineeName: "Priya Nair",
      traineeCode: "TRN-0104-033",
      programme: "Coop. Management",
      batch: "CMF-01",
      gender: "Female",
      trainingStart: "14 Oct 2026",
      trainingEnd: "28 Oct 2026",
      requestedHostel: "Women's Hostel",
      requestedHostelId: "h-2",
      roomPreference: "4 Sharing",
      acPreference: false,
      specialRequirement: "None",
      reason: "Kerala state coop council candidate.",
      submittedDate: "09 Oct 2026",
      status: "Waitlisted",
    },
    {
      id: "req-1046",
      requestId: "HR-1046",
      traineeId: "trn-vikram",
      traineeName: "Vikram Solanki",
      traineeCode: "TRN-0512-071",
      programme: "FPO Management",
      batch: "FPO-01",
      gender: "Male",
      trainingStart: "13 Oct 2026",
      trainingEnd: "27 Oct 2026",
      requestedHostel: "VAMNICOM Main Hostel",
      requestedHostelId: "h-1",
      roomPreference: "4 Sharing",
      acPreference: false,
      specialRequirement: "Quiet room",
      reason: "NABARD sponsored FPO leader.",
      submittedDate: "08 Oct 2026",
      status: "Allocated",
    },
    {
      id: "req-1047",
      requestId: "HR-1047",
      traineeId: "trn-neha",
      traineeName: "Neha Sharma",
      traineeCode: "TRN-0610-092",
      programme: "Digital Literacy",
      batch: "DL-01",
      gender: "Female",
      trainingStart: "12 Oct 2026",
      trainingEnd: "25 Oct 2026",
      requestedHostel: "Women's Hostel",
      requestedHostelId: "h-2",
      roomPreference: "4 Sharing",
      acPreference: false,
      specialRequirement: "None",
      reason: "SHG federated coordinator.",
      submittedDate: "08 Oct 2026",
      status: "Approved",
    }
  );

  // Key Check Records (Screenshot 1 & 2)
  checkRecords.push(
    {
      id: "chk-1",
      traineeId: "trn-ramesh",
      traineeName: "Ramesh Kumar",
      batch: "CMF-01",
      roomNumber: "A-101",
      bedNumber: "01",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block A",
      scheduledDate: "12 Oct 2026",
      time: "09:10 AM",
      actualDate: "12 Oct 2026",
      actualTime: "09:10 AM",
      idVerified: true,
      type: "check-in",
      status: "Checked In",
    },
    {
      id: "chk-2",
      traineeId: "trn-sunita-p",
      traineeName: "Sunita Patel",
      batch: "PDA-02",
      roomNumber: "A-101",
      bedNumber: "02",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block A",
      scheduledDate: "12 Oct 2026",
      time: "09:25 AM",
      actualDate: "12 Oct 2026",
      actualTime: "09:25 AM",
      idVerified: true,
      type: "check-in",
      status: "Checked In",
    },
    {
      id: "chk-3",
      traineeId: "trn-amit",
      traineeName: "Amit Gupta",
      batch: "CLG-01",
      roomNumber: "B-103",
      bedNumber: "01",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block B",
      scheduledDate: "12 Oct 2026",
      time: "09:40 AM",
      idVerified: false,
      type: "check-in",
      status: "Scheduled",
    },
    {
      id: "chk-4",
      traineeId: "trn-pooja",
      traineeName: "Pooja Sharma",
      batch: "DCO-01",
      roomNumber: "B-103",
      bedNumber: "02",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block B",
      scheduledDate: "12 Oct 2026",
      time: "10:15 AM",
      actualDate: "12 Oct 2026",
      actualTime: "10:15 AM",
      idVerified: true,
      type: "check-in",
      status: "Checked In",
    },
    {
      id: "chk-5",
      traineeId: "trn-rahul",
      traineeName: "Rahul Verma",
      batch: "PDA-02",
      roomNumber: "A-204",
      bedNumber: "04",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block A",
      scheduledDate: "12 Oct 2026",
      time: "10:30 AM",
      idVerified: true,
      type: "check-in",
      status: "Late",
    },
    {
      id: "chk-6",
      traineeId: "trn-neha-s",
      traineeName: "Neha Singh",
      batch: "DL-01",
      roomNumber: "A-204",
      bedNumber: "04",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block A",
      scheduledDate: "12 Oct 2026",
      time: "11:00 AM",
      idVerified: true,
      type: "check-in",
      status: "Scheduled",
    },
    {
      id: "chk-7",
      traineeId: "trn-vikram-s",
      traineeName: "Vikram Solanki",
      batch: "FPO-01",
      roomNumber: "C-101",
      bedNumber: "03",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block C",
      scheduledDate: "12 Oct 2026",
      time: "11:20 AM",
      idVerified: true,
      type: "check-in",
      status: "Checked In",
    },
    {
      id: "chk-8",
      traineeId: "trn-priya-n",
      traineeName: "Priya Nair",
      batch: "CMF-01",
      roomNumber: "A-205",
      bedNumber: "02",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block A",
      scheduledDate: "12 Oct 2026",
      time: "11:45 AM",
      idVerified: true,
      type: "check-in",
      status: "Scheduled",
    }
  );

  // Key Maintenance Issues from Screenshot 1 & 2
  maintenanceIssues.push(
    {
      id: "mt-1",
      issueId: "MT-1001",
      location: "A-201",
      hostelId: "h-1",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block A",
      roomNumber: "A-201",
      category: "Plumbing",
      priority: "High",
      description: "Tap leakage in bathroom causing floor dampness.",
      reportedBy: "Ramesh Kumar",
      reportedByRole: "Trainee",
      reportedDate: "11 Oct 2026",
      assignedTo: "P. Shinde (Plumber)",
      status: "Open",
    },
    {
      id: "mt-2",
      issueId: "MT-1002",
      location: "B Block",
      hostelId: "h-1",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block B",
      roomNumber: "B Corridor 2nd Floor",
      category: "Electrical",
      priority: "Medium",
      description: "Corridor tube light flickering and loose switchboard.",
      reportedBy: "Sunita Patel",
      reportedByRole: "Trainee",
      reportedDate: "10 Oct 2026",
      assignedTo: "V. Gaikwad (Electrician)",
      status: "In Progress",
    },
    {
      id: "mt-3",
      issueId: "MT-1003",
      location: "C-105",
      hostelId: "h-1",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block C",
      roomNumber: "C-105",
      category: "Furniture",
      priority: "Low",
      description: "Study chair wheel broken and table drawer stuck.",
      reportedBy: "Amit Gupta",
      reportedByRole: "Trainee",
      reportedDate: "09 Oct 2026",
      assignedTo: "K. Carpenter",
      status: "Resolved",
      resolution: "Replaced chair wheel and lubricated drawer slide.",
      resolvedAt: "10 Oct 2026",
    },
    {
      id: "mt-4",
      issueId: "MT-1004",
      location: "A-304",
      hostelId: "h-1",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block A",
      roomNumber: "A-304",
      category: "Wi-Fi",
      priority: "High",
      description: "Access Point offline; weak signal in rooms A-301 to A-306.",
      reportedBy: "Priya Nair",
      reportedByRole: "Trainee",
      reportedDate: "09 Oct 2026",
      status: "Open",
    },
    {
      id: "mt-5",
      issueId: "MT-1005",
      location: "D-201",
      hostelId: "h-1",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block D",
      roomNumber: "D-201",
      category: "Cleaning",
      priority: "Medium",
      description: "Balcony deep cleaning and dustbin replacement needed.",
      reportedBy: "Neha Singh",
      reportedByRole: "Trainee",
      reportedDate: "08 Oct 2026",
      assignedTo: "Housekeeping Staff",
      status: "Assigned",
    },
    {
      id: "mt-6",
      issueId: "MT-1006",
      location: "Mess Area Supply",
      hostelId: "h-1",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Mess Block",
      roomNumber: "Mess Hall",
      category: "Other",
      priority: "High",
      description: "Water purifier filter replacement scheduled.",
      reportedBy: "Vikram Solanki",
      reportedByRole: "Trainee",
      reportedDate: "08 Oct 2026",
      status: "In Progress",
    }
  );

  // Key Notices
  notices.push(
    {
      id: "nt-1",
      noticeId: "NOT-201",
      title: "Mess Timing Update",
      category: "Mess",
      audience: "All Residents",
      hostelName: "VAMNICOM Main Hostel",
      description: "Lunch timing has been updated to 12:30 PM - 1:30 PM starting 12 Oct 2026 to align with practical laboratory batches.",
      publishDate: "12 Oct 2026",
      priority: "Normal",
      isPinned: true,
    },
    {
      id: "nt-2",
      noticeId: "NOT-202",
      title: "Room Inspection Schedule",
      category: "Discipline",
      audience: "Block A & B Residents",
      hostelName: "VAMNICOM Main Hostel",
      blockName: "Block A",
      description: "Routine hygiene, electrical appliance, and cleanliness inspection will be conducted on 15 Oct 2026 between 5:00 PM and 7:00 PM.",
      publishDate: "11 Oct 2026",
      priority: "Normal",
      isPinned: false,
    },
    {
      id: "nt-3",
      noticeId: "NOT-203",
      title: "Wi-Fi Maintenance & Fiber Upgrade",
      category: "Technical",
      audience: "All Blocks",
      hostelName: "VAMNICOM Main Hostel",
      description: "High-speed optical fiber backbone upgrade scheduled for 14 Oct (10:00 AM - 2:00 PM). Minor intermittent downtime expected.",
      publishDate: "10 Oct 2026",
      priority: "High",
      isPinned: true,
    },
    {
      id: "nt-4",
      noticeId: "NOT-204",
      title: "Hostel Gate Closing Time",
      category: "Security",
      audience: "All Trainees",
      hostelName: "VAMNICOM Main Hostel",
      description: "Hostel main perimeter gates close strictly at 10:00 PM. No entry allowed after 10:00 PM without prior written warden gate pass.",
      publishDate: "08 Oct 2026",
      priority: "High",
      isPinned: false,
    }
  );

  // Key Facilities
  facilities.push(
    { id: "fac-1", name: "Wi-Fi", icon: "Wifi", status: "Available", timing: "24 x 7", description: "High-speed campus network with eduroam access", hostelName: "VAMNICOM Main Hostel" },
    { id: "fac-2", name: "Mess", icon: "Utensils", status: "Available", timing: "Breakfast, Lunch, Dinner", description: "Hygienic vegetarian buffet with regional options", hostelName: "VAMNICOM Main Hostel" },
    { id: "fac-3", name: "Laundry", icon: "Shirt", status: "Available", timing: "8:00 AM - 8:00 PM", description: "Commercial washing machines & ironing tables", hostelName: "VAMNICOM Main Hostel" },
    { id: "fac-4", name: "Common Room", icon: "Tv", status: "Available", timing: "TV, Reading Area", description: "Recreation lounge with newspaper & periodicals", hostelName: "VAMNICOM Main Hostel" },
    { id: "fac-5", name: "Study Room", icon: "BookOpen", status: "Available", timing: "8:00 AM - 10:00 PM", description: "Silent study zone with individual cubicles", hostelName: "VAMNICOM Main Hostel" },
    { id: "fac-6", name: "Drinking Water", icon: "Droplets", status: "Available", timing: "24 x 7", description: "UV + RO chilled water dispensers on all floors", hostelName: "VAMNICOM Main Hostel" },
    { id: "fac-7", name: "Hot Water", icon: "Sun", status: "Available", timing: "6:00 AM - 10:00 AM", description: "Solar water heaters backed up by electric boilers", hostelName: "VAMNICOM Main Hostel" },
    { id: "fac-8", name: "Security", icon: "Shield", status: "Available", timing: "24 x 7", description: "Biometric turnstiles and uniformed guards", hostelName: "VAMNICOM Main Hostel" },
    { id: "fac-9", name: "CCTV", icon: "Camera", status: "Available", timing: "24 x 7", description: "128 full-coverage HD IP surveillance cameras", hostelName: "VAMNICOM Main Hostel" },
    { id: "fac-10", name: "Gym", icon: "Dumbbell", status: "Maintenance", timing: "Temporarily Unavailable", description: "Modern cardiovascular fitness suite & weights", hostelName: "VAMNICOM Main Hostel" },
  );

  // Generate 192 Rooms and 640 Beds across Blocks A, B, C, D, E
  const blocksConfig = [
    { code: "A", name: "Block A", floors: 4, roomsPerFloor: 10, hostelId: "h-1", hostelName: "VAMNICOM Main Hostel", gender: "Mixed" as const },
    { code: "B", name: "Block B", floors: 4, roomsPerFloor: 9, hostelId: "h-1", hostelName: "VAMNICOM Main Hostel", gender: "Mixed" as const },
    { code: "C", name: "Block C", floors: 3, roomsPerFloor: 10, hostelId: "h-1", hostelName: "VAMNICOM Main Hostel", gender: "Mixed" as const },
    { code: "D", name: "Block D", floors: 3, roomsPerFloor: 9, hostelId: "h-1", hostelName: "VAMNICOM Main Hostel", gender: "Mixed" as const },
    { code: "E", name: "Block E", floors: 3, roomsPerFloor: 10, hostelId: "h-2", hostelName: "Women's Hostel", gender: "Female" as const },
  ];

  let roomCounter = 1;
  let bedCounter = 1;

  blocksConfig.forEach((bCfg) => {
    for (let f = 1; f <= bCfg.floors; f++) {
      for (let r = 1; r <= bCfg.roomsPerFloor; r++) {
        const roomNum = `${bCfg.code}-${f}0${r < 10 ? r : r}`;
        if (roomNum === "A-204") continue; // already customized above

        const capacity = (f === 1 && r <= 3) ? 2 : (f === 2 && r <= 4) ? 6 : 4;
        const roomType: RoomType = capacity === 2 ? "Double" : capacity === 6 ? "6 Sharing" : "4 Sharing";

        // Assign status deterministically to meet screenshot distribution:
        // Available ~28%, Partial ~34%, Full ~38%, Maint ~4%
        const rand = (r * 13 + f * 7) % 100;
        let status: RoomStatus = "Full";
        let occupied = capacity;
        if (rand < 28) {
          status = "Available";
          occupied = 0;
        } else if (rand < 62) {
          status = "Partially Occupied";
          occupied = Math.max(1, capacity - ((rand % 2) + 1));
        } else if (rand > 96) {
          status = "Maintenance";
          occupied = 0;
        }

        const roomBeds: Bed[] = [];
        for (let b = 1; b <= capacity; b++) {
          const bedNum = `Bed 0${b}`;
          let bStatus: BedStatus = "AVAILABLE";
          if (status === "Maintenance") {
            bStatus = "MAINTENANCE";
          } else if (b <= occupied) {
            bStatus = "OCCUPIED";
          }

          const bedObj: Bed = {
            id: `bed-${bCfg.code.toLowerCase()}-${roomNum}-${b}`,
            roomId: `rm-${roomNum.toLowerCase()}`,
            roomNumber: roomNum,
            bedNumber: bedNum,
            status: bStatus,
          };
          roomBeds.push(bedObj);
          beds.push(bedObj);
          bedCounter++;
        }

        const roomObj: Room = {
          id: `rm-${roomNum.toLowerCase()}`,
          roomNumber: roomNum,
          hostelId: bCfg.hostelId,
          hostelName: bCfg.hostelName,
          blockId: `blk-${bCfg.code.toLowerCase()}`,
          blockName: bCfg.name,
          floor: f,
          roomType,
          capacity,
          occupied,
          available: capacity - occupied,
          gender: bCfg.gender,
          status,
          ac: f === 4,
          attachedBathroom: f > 1,
          facilities: ["Wi-Fi", "Study Table", "Wardrobe", "Ceiling Fan"],
          beds: roomBeds,
          assignedTrainees: [],
        };
        rooms.push(roomObj);
        roomCounter++;
      }
    }
  });

  // Generate 1,200+ Trainees across 8 Programmes and Batches
  for (let i = 1; i <= 1250; i++) {
    const fn = INDIAN_FIRST_NAMES[i % INDIAN_FIRST_NAMES.length];
    const ln = INDIAN_LAST_NAMES[(i * 7) % INDIAN_LAST_NAMES.length];
    const fullName = `${fn} ${ln}`;
    const prog = PROGRAMMES_DATA[i % PROGRAMMES_DATA.length];
    const batch = prog.batches[i % prog.batches.length];
    const isFemale = ["Sunita", "Pooja", "Priya", "Neha", "Anjali", "Farida", "Meena", "Kavita", "Sneha", "Shweta", "Anita", "Jyoti", "Preeti", "Rekha", "Ritu", "Komal", "Divya", "Pallavi", "Aarti"].includes(fn);
    const gender = isFemale ? "Female" : "Male";

    // 74% allocated to match total beds
    const isAllocated = i <= 472;
    const isDayScholar = i > 472 && i <= 650;
    const isPending = i > 650 && i <= 676; // 26 pending

    const traineeId = `trn-${i + 1000}`;
    const traineeCode = `TRN-0${i < 100 ? "0" + i : i}-${(i * 17) % 99 + 10}`;

    let hStatus = isAllocated ? "Checked In" : isPending ? "Pending" : "Not Applied";
    let roomNum = "";
    let bedNum = "";
    let block = "";
    let hostel = "";

    if (isAllocated && i < rooms.length) {
      const targetRoom = rooms[i % rooms.length];
      roomNum = targetRoom.roomNumber;
      bedNum = `0${(i % targetRoom.capacity) + 1}`;
      block = targetRoom.blockName;
      hostel = targetRoom.hostelName;

      targetRoom.assignedTrainees.push({
        id: traineeId,
        name: fullName,
        avatar: `${fn[0]}${ln[0]}`,
        batch,
        bedNumber: bedNum,
      });

      allocations.push({
        id: `alc-${i + 2000}`,
        allocationId: `ALC-${i + 2000}`,
        traineeId,
        traineeName: fullName,
        traineeCode,
        gender,
        programme: prog.name,
        batch,
        hostelId: targetRoom.hostelId,
        hostelName: targetRoom.hostelName,
        blockId: targetRoom.blockId,
        blockName: targetRoom.blockName,
        roomId: targetRoom.id,
        roomNumber: targetRoom.roomNumber,
        bedId: `bed-${targetRoom.roomNumber}-${bedNum}`,
        bedNumber: bedNum,
        roomType: targetRoom.roomType,
        allocatedAt: "10 Oct 2026",
        allocatedBy: "Institution Admin",
        checkInDate: "12 Oct 2026",
        expectedCheckout: "25 Oct 2026",
        status: "Checked In",
      });

      // Daily attendance for 12 Oct 2026
      // 91% Present (430), 4% Absent (19), 3% On Leave (14), 2% Out Permission (9)
      let attStatus: "Present" | "Absent" | "On Leave" | "Out Permission" = "Present";
      if (i > 430 && i <= 449) attStatus = "Absent";
      else if (i > 449 && i <= 463) attStatus = "On Leave";
      else if (i > 463 && i <= 472) attStatus = "Out Permission";

      attendanceRecords.push({
        id: `att-${i}`,
        traineeId,
        traineeName: fullName,
        batch,
        hostelId: targetRoom.hostelId,
        hostelName: targetRoom.hostelName,
        blockId: targetRoom.blockId,
        blockName: targetRoom.blockName,
        roomId: targetRoom.id,
        roomNumber: targetRoom.roomNumber,
        bedNumber: bedNum,
        date: "12 Oct 2026",
        status: attStatus,
        markedBy: "Biometric Turnstile Station #01",
        markedAt: `12 Oct 2026 09:${(i % 50) < 10 ? "0" + (i % 50) : (i % 50)} AM`,
        remarks: attStatus === "On Leave" ? "Out for family event" : attStatus === "Out Permission" ? "Went home (permission)" : "",
      });
    }

    trainees.push({
      id: traineeId,
      traineeCode,
      fullName,
      gender,
      age: 22 + (i % 25),
      phone: `+91 ${98000 + (i % 999)} ${10000 + (i * 37) % 89999}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@coopsetu.ai`,
      state: i % 2 === 0 ? "Maharashtra" : "Gujarat",
      district: i % 3 === 0 ? "Pune" : i % 3 === 1 ? "Kolhapur" : "Anand",
      cooperative: `${prog.name} Society Federation`,
      society: `Primary PACS Unit #${(i % 80) + 1}`,
      programme: prog.name,
      programmeCode: prog.code,
      batch,
      trainingStart: "12 Oct 2026",
      trainingEnd: "25 Oct 2026",
      hostelRequired: !isDayScholar,
      hostelStatus: isAllocated ? "Checked In" : isPending ? "Pending" : "Not Applied",
      hostelId: hostel ? "h-1" : undefined,
      hostelName: hostel || undefined,
      blockId: block ? "blk-a" : undefined,
      blockName: block || undefined,
      roomId: roomNum ? `rm-${roomNum}` : undefined,
      roomNumber: roomNum || undefined,
      bedId: bedNum ? `bed-${roomNum}-${bedNum}` : undefined,
      bedNumber: bedNum || undefined,
      checkInStatus: isAllocated ? "Checked In" : undefined,
      checkInDate: isAllocated ? "12 Oct 2026" : undefined,
      expectedCheckout: isAllocated ? "25 Oct 2026" : undefined,
      actualCheckIn: isAllocated ? "12 Oct 2026, 09:15 AM" : undefined,
      idVerified: isAllocated,
      emergencyContact: `Guardian of ${fullName} — +91 94220 ${(i * 41) % 89999 + 10000}`,
      status: "Active",
    });

    if (i <= 420) {
      requests.push({
        id: `req-gen-${i}`,
        requestId: `HR-${1100 + i}`,
        traineeId,
        traineeName: fullName,
        traineeCode,
        programme: prog.name,
        batch,
        gender,
        trainingStart: "12 Oct 2026",
        trainingEnd: "25 Oct 2026",
        requestedHostel: gender === "Female" ? "Women's Hostel" : "VAMNICOM Main Hostel",
        requestedHostelId: gender === "Female" ? "h-2" : "h-1",
        roomPreference: "4 Sharing",
        acPreference: false,
        specialRequirement: "Standard",
        reason: "Mandatory residential module enrollment.",
        submittedDate: "05 Oct 2026",
        status: isAllocated ? "Allocated" : isPending ? "Pending" : "Approved",
      });
    }
  }

  // Ensure exact KPIs matching Screenshot 1:
  // Total Beds: 640, Occupied: 472, Available: 142, Reserved: 18, Maintenance: 8, Pending: 26, Check-in: 34, Check-out: 21
  const stats: HostelStats = {
    totalBeds: 640,
    occupiedBeds: 472,
    availableBeds: 142,
    reservedBeds: 18,
    pendingRequests: 26,
    maintenanceBeds: 8,
    todayCheckIns: 34,
    todayCheckOuts: 21,
    overallOccupancyRate: 74,
    blockOccupancy: [
      { name: "Block A", occupied: 120, total: 160, percent: 75 },
      { name: "Block B", occupied: 104, total: 140, percent: 74 },
      { name: "Block C", occupied: 92, total: 120, percent: 77 },
      { name: "Block D", occupied: 86, total: 110, percent: 78 },
      { name: "Block E", occupied: 70, total: 110, percent: 64 },
    ],
    hostelOccupancy: [
      { name: "VAMNICOM Main Hostel", occupied: 312, total: 420, percent: 74, color: "#EF4444" },
      { name: "Women's Hostel", occupied: 96, total: 120, percent: 80, color: "#EC4899" },
      { name: "Training Residential", occupied: 30, total: 50, percent: 60, color: "#3B82F6" },
      { name: "Guest & Faculty", occupied: 34, total: 50, percent: 68, color: "#10B981" },
      { name: "Overflow Accommodation", occupied: 0, total: 0, percent: 0, color: "#6B7280" },
    ],
    roomStatusCounts: {
      available: 142,
      partiallyOccupied: 86,
      full: 74,
      maintenance: 8,
    },
    attendanceSummary: {
      presentRate: 91,
      absentRate: 4,
      onLeaveRate: 3,
      outPermissionRate: 2,
      totalResidents: 472,
      presentCount: 430,
      absentCount: 19,
      onLeaveCount: 14,
      outPermissionCount: 9,
    },
  };

  return {
    hostels: INITIAL_HOSTELS,
    blocks: INITIAL_BLOCKS,
    rooms,
    beds,
    trainees,
    allocations,
    requests,
    checkRecords,
    attendanceRecords,
    maintenanceIssues,
    notices,
    facilities,
    stats,
  };
}
