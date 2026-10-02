export type HostelGender = "Mixed" | "Male" | "Female";

export type RoomType =
  | "Single"
  | "Double"
  | "Triple"
  | "4 Sharing"
  | "6 Sharing"
  | "8 Sharing";

export type RoomStatus =
  | "Available"
  | "Partially Occupied"
  | "Full"
  | "Maintenance"
  | "Reserved"
  | "Closed";

export type BedStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

export type AllocationStatus =
  | "Pending"
  | "Allocated"
  | "Checked In"
  | "Checked Out"
  | "Waitlisted"
  | "Cancelled";

export type RequestStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Waitlisted"
  | "Allocated"
  | "Cancelled";

export type CheckRecordStatus =
  | "Scheduled"
  | "Checked In"
  | "Late"
  | "Checked Out"
  | "Overdue"
  | "Cancelled";

export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "On Leave"
  | "Out Permission"
  | "Not Marked";

export type MaintenanceCategory =
  | "Plumbing"
  | "Electrical"
  | "Furniture"
  | "Cleaning"
  | "Wi-Fi"
  | "HVAC"
  | "Bathroom"
  | "Laundry"
  | "Security"
  | "Other";

export type PriorityLevel = "Low" | "Medium" | "High" | "Critical";

export type MaintenanceStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Resolved"
  | "Closed";

export type NoticeCategory =
  | "General"
  | "Mess"
  | "Security"
  | "Maintenance"
  | "Check-in"
  | "Check-out"
  | "Emergency"
  | "Discipline"
  | "Events"
  | "Technical";

export interface Hostel {
  id: string;
  code: string;
  name: string;
  location: string;
  gender: HostelGender;
  blocksCount: number;
  roomsCount: number;
  bedsCount: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  maintenanceBeds: number;
  occupancyRate: number;
  wardenName: string;
  wardenPhone: string;
  wardenEmail: string;
  photoUrl: string;
  status: "Active" | "Partially Occupied" | "Full" | "Maintenance";
  description: string;
}

export interface HostelBlock {
  id: string;
  hostelId: string;
  name: string;
  code: string;
  floorCount: number;
  roomsCount: number;
  bedsCount: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  gender: HostelGender;
  wardenName: string;
  wardenPhone: string;
  status: "ACTIVE" | "PARTIAL" | "FULL" | "MAINTENANCE";
}

export interface Bed {
  id: string;
  roomId: string;
  roomNumber: string;
  bedNumber: string;
  status: BedStatus;
  traineeId?: string;
  traineeName?: string;
  allocationId?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  hostelId: string;
  hostelName: string;
  blockId: string;
  blockName: string;
  floor: number;
  roomType: RoomType;
  capacity: number;
  occupied: number;
  available: number;
  gender: HostelGender;
  status: RoomStatus;
  ac: boolean;
  attachedBathroom: boolean;
  facilities: string[];
  distanceToHall?: string;
  beds: Bed[];
  assignedTrainees: {
    id: string;
    name: string;
    avatar: string;
    batch: string;
    bedNumber: string;
  }[];
}

export interface TraineeProfile {
  id: string;
  traineeCode: string;
  fullName: string;
  gender: "Male" | "Female" | "Other";
  age: number;
  phone: string;
  email: string;
  state: string;
  district: string;
  cooperative: string;
  society: string;
  programme: string;
  programmeCode: string;
  batch: string;
  trainingStart: string;
  trainingEnd: string;
  hostelRequired: boolean;
  hostelStatus: AllocationStatus | "Not Applied" | "Approved" | "Rejected";
  hostelId?: string;
  hostelName?: string;
  blockId?: string;
  blockName?: string;
  roomId?: string;
  roomNumber?: string;
  bedId?: string;
  bedNumber?: string;
  checkInStatus?: "Scheduled" | "Checked In" | "Late" | "Checked Out" | "On Leave" | "Day Scholar";
  checkInDate?: string;
  expectedCheckout?: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  idVerified?: boolean;
  emergencyContact: string;
  specialRequirement?: string;
  status: "Active" | "Completed";
}

export interface HostelRequest {
  id: string;
  requestId: string;
  traineeId: string;
  traineeName: string;
  traineeCode: string;
  programme: string;
  batch: string;
  gender: "Male" | "Female" | "Other";
  trainingStart: string;
  trainingEnd: string;
  requestedHostel: string;
  requestedHostelId: string;
  roomPreference: RoomType;
  acPreference: boolean;
  specialRequirement: string;
  reason: string;
  submittedDate: string;
  status: RequestStatus;
  reviewedBy?: string;
  reviewedDate?: string;
  remarks?: string;
  allocatedRoom?: string;
  allocatedBed?: string;
}

export interface HostelAllocation {
  id: string;
  allocationId: string;
  traineeId: string;
  traineeName: string;
  traineeCode: string;
  gender: "Male" | "Female" | "Other";
  programme: string;
  batch: string;
  hostelId: string;
  hostelName: string;
  blockId: string;
  blockName: string;
  roomId: string;
  roomNumber: string;
  bedId: string;
  bedNumber: string;
  roomType: RoomType;
  allocatedAt: string;
  allocatedBy: string;
  checkInDate: string;
  expectedCheckout: string;
  status: AllocationStatus;
}

export interface CheckRecord {
  id: string;
  traineeId: string;
  traineeName: string;
  batch: string;
  roomNumber: string;
  bedNumber: string;
  hostelName: string;
  blockName: string;
  scheduledDate: string;
  time: string;
  actualDate?: string;
  actualTime?: string;
  verifiedBy?: string;
  idVerified: boolean;
  remarks?: string;
  type: "check-in" | "check-out";
  status: CheckRecordStatus;
}

export interface HostelAttendanceRecord {
  id: string;
  traineeId: string;
  traineeName: string;
  batch: string;
  hostelId: string;
  hostelName: string;
  blockId: string;
  blockName: string;
  roomId: string;
  roomNumber: string;
  bedNumber: string;
  date: string;
  status: AttendanceStatus;
  markedBy?: string;
  markedAt?: string;
  remarks?: string;
}

export interface MaintenanceIssue {
  id: string;
  issueId: string;
  location: string;
  hostelId: string;
  hostelName: string;
  blockName: string;
  roomNumber: string;
  category: MaintenanceCategory;
  priority: PriorityLevel;
  description: string;
  reportedBy: string;
  reportedByRole: string;
  reportedDate: string;
  assignedTo?: string;
  status: MaintenanceStatus;
  resolution?: string;
  resolvedAt?: string;
}

export interface HostelNotice {
  id: string;
  noticeId: string;
  title: string;
  category: NoticeCategory;
  audience: string;
  hostelName: string;
  blockName?: string;
  description: string;
  publishDate: string;
  expiryDate?: string;
  priority: "Normal" | "High" | "Urgent";
  isPinned: boolean;
  attachmentName?: string;
}

export interface HostelFacility {
  id: string;
  name: string;
  icon: string;
  status: "Available" | "Unavailable" | "Maintenance";
  timing: string;
  description: string;
  hostelName: string;
}

export interface HostelStats {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  pendingRequests: number;
  maintenanceBeds: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  overallOccupancyRate: number;
  blockOccupancy: {
    name: string;
    occupied: number;
    total: number;
    percent: number;
  }[];
  hostelOccupancy: {
    name: string;
    occupied: number;
    total: number;
    percent: number;
    color: string;
  }[];
  roomStatusCounts: {
    available: number;
    partiallyOccupied: number;
    full: number;
    maintenance: number;
  };
  attendanceSummary: {
    presentRate: number;
    absentRate: number;
    onLeaveRate: number;
    outPermissionRate: number;
    totalResidents: number;
    presentCount: number;
    absentCount: number;
    onLeaveCount: number;
    outPermissionCount: number;
  };
}
