"use client";

import {
  generateFullHostelDataset,
  DEMO_TRAINEE_RAVINDRA,
  DEMO_ROOM_A204,
} from "./mock-data";
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
  AttendanceStatus,
} from "./types";

interface HostelState {
  hostels: Hostel[];
  blocks: HostelBlock[];
  rooms: Room[];
  beds: Bed[];
  trainees: TraineeProfile[];
  allocations: HostelAllocation[];
  requests: HostelRequest[];
  checkRecords: CheckRecord[];
  attendanceRecords: HostelAttendanceRecord[];
  maintenanceIssues: MaintenanceIssue[];
  notices: HostelNotice[];
  facilities: HostelFacility[];
  stats: HostelStats;
}

const STORAGE_KEY = "coopsetu_hostel_state_v1";

class HostelService {
  private state: HostelState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): HostelState {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn("Failed to load hostel state from localStorage", e);
      }
    }
    return generateFullHostelDataset();
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.warn("Failed to persist hostel state to localStorage", e);
      }
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Error in hostel service listener", err);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public resetToDefault() {
    this.state = generateFullHostelDataset();
    this.persist();
  }

  // Getters
  public getHostels(): Hostel[] {
    return this.state.hostels;
  }

  public getBlocks(): HostelBlock[] {
    return this.state.blocks;
  }

  public getRooms(): Room[] {
    return this.state.rooms;
  }

  public getRoomByNumber(roomNumber: string): Room | undefined {
    return this.state.rooms.find((r) => r.roomNumber.toLowerCase() === roomNumber.toLowerCase());
  }

  public getBeds(): Bed[] {
    return this.state.beds;
  }

  public getTrainees(): TraineeProfile[] {
    return this.state.trainees;
  }

  public getTraineeById(id: string): TraineeProfile | undefined {
    return this.state.trainees.find((t) => t.id === id || t.traineeCode === id);
  }

  public getAllocations(): HostelAllocation[] {
    return this.state.allocations;
  }

  public getRequests(): HostelRequest[] {
    return this.state.requests;
  }

  public getCheckRecords(): CheckRecord[] {
    return this.state.checkRecords;
  }

  public getAttendanceRecords(): HostelAttendanceRecord[] {
    return this.state.attendanceRecords;
  }

  public getMaintenanceIssues(): MaintenanceIssue[] {
    return this.state.maintenanceIssues;
  }

  public getNotices(): HostelNotice[] {
    return this.state.notices;
  }

  public getFacilities(): HostelFacility[] {
    return this.state.facilities;
  }

  public getStats(): HostelStats {
    return this.state.stats;
  }

  // Admin Actions
  public allocateRoom(
    traineeId: string,
    roomId: string,
    bedId: string,
    allocatedBy = "Institution Admin"
  ): boolean {
    const trainee = this.state.trainees.find((t) => t.id === traineeId);
    const room = this.state.rooms.find((r) => r.id === roomId);
    if (!trainee || !room) return false;

    const bed = room.beds.find((b) => b.id === bedId);
    if (!bed || bed.status === "OCCUPIED") return false;

    // Update Bed
    bed.status = "OCCUPIED";
    bed.traineeId = trainee.id;
    bed.traineeName = trainee.fullName;

    // Update Room
    room.occupied = room.beds.filter((b) => b.status === "OCCUPIED").length;
    room.available = room.capacity - room.occupied;
    room.status =
      room.occupied === room.capacity
        ? "Full"
        : room.occupied > 0
        ? "Partially Occupied"
        : "Available";

    // Add Trainee to room list if not present
    if (!room.assignedTrainees.some((at) => at.id === trainee.id)) {
      const parts = trainee.fullName.split(" ");
      const avatar = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0].slice(0, 2);
      room.assignedTrainees.push({
        id: trainee.id,
        name: trainee.fullName,
        avatar: avatar.toUpperCase(),
        batch: trainee.batch,
        bedNumber: bed.bedNumber,
      });
    }

    // Update Trainee
    trainee.hostelStatus = "Allocated";
    trainee.hostelId = room.hostelId;
    trainee.hostelName = room.hostelName;
    trainee.blockId = room.blockId;
    trainee.blockName = room.blockName;
    trainee.roomId = room.id;
    trainee.roomNumber = room.roomNumber;
    trainee.bedId = bed.id;
    trainee.bedNumber = bed.bedNumber;
    trainee.checkInStatus = "Scheduled";

    // Update or Create Allocation
    const existingAlc = this.state.allocations.find((a) => a.traineeId === traineeId);
    if (existingAlc) {
      existingAlc.roomId = room.id;
      existingAlc.roomNumber = room.roomNumber;
      existingAlc.bedId = bed.id;
      existingAlc.bedNumber = bed.bedNumber;
      existingAlc.hostelId = room.hostelId;
      existingAlc.hostelName = room.hostelName;
      existingAlc.blockId = room.blockId;
      existingAlc.blockName = room.blockName;
      existingAlc.status = "Allocated";
    } else {
      this.state.allocations.unshift({
        id: `alc-${Date.now()}`,
        allocationId: `ALC-${Math.floor(1000 + Math.random() * 9000)}`,
        traineeId: trainee.id,
        traineeName: trainee.fullName,
        traineeCode: trainee.traineeCode,
        gender: trainee.gender,
        programme: trainee.programme,
        batch: trainee.batch,
        hostelId: room.hostelId,
        hostelName: room.hostelName,
        blockId: room.blockId,
        blockName: room.blockName,
        roomId: room.id,
        roomNumber: room.roomNumber,
        bedId: bed.id,
        bedNumber: bed.bedNumber,
        roomType: room.roomType,
        allocatedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        allocatedBy,
        checkInDate: trainee.trainingStart || "12 Oct 2026",
        expectedCheckout: trainee.trainingEnd || "25 Oct 2026",
        status: "Allocated",
      });
    }

    // Update Request status if any
    const req = this.state.requests.find((r) => r.traineeId === traineeId);
    if (req) {
      req.status = "Allocated";
      req.allocatedRoom = room.roomNumber;
      req.allocatedBed = bed.bedNumber;
      req.reviewedBy = allocatedBy;
      req.reviewedDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }

    // Recalculate stats
    this.recalculateStats();
    this.persist();
    return true;
  }

  public checkInTrainee(traineeId: string, verifiedBy = "Duty Warden"): boolean {
    const trainee = this.state.trainees.find((t) => t.id === traineeId);
    if (!trainee) return false;

    trainee.checkInStatus = "Checked In";
    trainee.hostelStatus = "Checked In";
    trainee.actualCheckIn = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    trainee.idVerified = true;

    // Update allocation
    const alc = this.state.allocations.find((a) => a.traineeId === traineeId);
    if (alc) alc.status = "Checked In";

    // Add check record
    this.state.checkRecords.unshift({
      id: `chk-${Date.now()}`,
      traineeId: trainee.id,
      traineeName: trainee.fullName,
      batch: trainee.batch,
      roomNumber: trainee.roomNumber || "A-204",
      bedNumber: trainee.bedNumber || "02",
      hostelName: trainee.hostelName || "VAMNICOM Main Hostel",
      blockName: trainee.blockName || "Block A",
      scheduledDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actualDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      actualTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      verifiedBy,
      idVerified: true,
      type: "check-in",
      status: "Checked In",
    });

    this.recalculateStats();
    this.persist();
    return true;
  }

  public checkOutTrainee(traineeId: string): boolean {
    const trainee = this.state.trainees.find((t) => t.id === traineeId);
    if (!trainee) return false;

    // Release Bed
    if (trainee.roomId && trainee.bedId) {
      const room = this.state.rooms.find((r) => r.id === trainee.roomId);
      if (room) {
        const bed = room.beds.find((b) => b.id === trainee.bedId);
        if (bed) {
          bed.status = "AVAILABLE";
          bed.traineeId = undefined;
          bed.traineeName = undefined;
        }
        room.occupied = room.beds.filter((b) => b.status === "OCCUPIED").length;
        room.available = room.capacity - room.occupied;
        room.status = room.occupied === 0 ? "Available" : "Partially Occupied";
        room.assignedTrainees = room.assignedTrainees.filter((at) => at.id !== trainee.id);
      }
    }

    trainee.checkInStatus = "Checked Out";
    trainee.hostelStatus = "Checked Out";
    trainee.actualCheckOut = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const alc = this.state.allocations.find((a) => a.traineeId === traineeId);
    if (alc) alc.status = "Checked Out";

    this.state.checkRecords.unshift({
      id: `chk-out-${Date.now()}`,
      traineeId: trainee.id,
      traineeName: trainee.fullName,
      batch: trainee.batch,
      roomNumber: trainee.roomNumber || "A-204",
      bedNumber: trainee.bedNumber || "02",
      hostelName: trainee.hostelName || "VAMNICOM Main Hostel",
      blockName: trainee.blockName || "Block A",
      scheduledDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actualDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      actualTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      idVerified: true,
      type: "check-out",
      status: "Checked Out",
    });

    this.recalculateStats();
    this.persist();
    return true;
  }

  public approveRequest(requestId: string, reviewer = "Institution Admin"): boolean {
    const req = this.state.requests.find((r) => r.id === requestId || r.requestId === requestId);
    if (!req) return false;

    req.status = "Approved";
    req.reviewedBy = reviewer;
    req.reviewedDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const trainee = this.state.trainees.find((t) => t.id === req.traineeId);
    if (trainee) {
      trainee.hostelStatus = "Approved";
    }

    this.persist();
    return true;
  }

  public rejectRequest(requestId: string, remarks: string, reviewer = "Institution Admin"): boolean {
    const req = this.state.requests.find((r) => r.id === requestId || r.requestId === requestId);
    if (!req) return false;

    req.status = "Rejected";
    req.remarks = remarks;
    req.reviewedBy = reviewer;
    req.reviewedDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const trainee = this.state.trainees.find((t) => t.id === req.traineeId);
    if (trainee) {
      trainee.hostelStatus = "Rejected";
    }

    this.persist();
    return true;
  }

  public waitlistRequest(requestId: string): boolean {
    const req = this.state.requests.find((r) => r.id === requestId || r.requestId === requestId);
    if (!req) return false;

    req.status = "Waitlisted";
    const trainee = this.state.trainees.find((t) => t.id === req.traineeId);
    if (trainee) {
      trainee.hostelStatus = "Waitlisted";
    }

    this.persist();
    return true;
  }

  public reportMaintenanceIssue(
    issue: Omit<MaintenanceIssue, "id" | "issueId" | "reportedDate" | "status">
  ): MaintenanceIssue {
    const newIssue: MaintenanceIssue = {
      ...issue,
      id: `mt-${Date.now()}`,
      issueId: `MT-${Math.floor(1000 + Math.random() * 9000)}`,
      reportedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      status: "Open",
    };
    this.state.maintenanceIssues.unshift(newIssue);
    this.persist();
    return newIssue;
  }

  public resolveMaintenanceIssue(issueId: string, resolution: string): boolean {
    const issue = this.state.maintenanceIssues.find((i) => i.id === issueId || i.issueId === issueId);
    if (!issue) return false;

    issue.status = "Resolved";
    issue.resolution = resolution;
    issue.resolvedAt = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    this.persist();
    return true;
  }

  public createNotice(notice: Omit<HostelNotice, "id" | "noticeId" | "publishDate">): HostelNotice {
    const newNotice: HostelNotice = {
      ...notice,
      id: `nt-${Date.now()}`,
      noticeId: `NOT-${Math.floor(200 + Math.random() * 800)}`,
      publishDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };
    this.state.notices.unshift(newNotice);
    this.persist();
    return newNotice;
  }

  public markAttendance(
    traineeId: string,
    status: AttendanceStatus,
    date = "12 Oct 2026",
    remarks?: string,
    markedBy = "Hostel Warden"
  ) {
    const trainee = this.state.trainees.find((t) => t.id === traineeId);
    if (!trainee) return false;

    let rec = this.state.attendanceRecords.find((a) => a.traineeId === traineeId && a.date === date);
    if (rec) {
      rec.status = status;
      rec.remarks = remarks || rec.remarks;
      rec.markedBy = markedBy;
      rec.markedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      this.state.attendanceRecords.unshift({
        id: `att-${Date.now()}`,
        traineeId: trainee.id,
        traineeName: trainee.fullName,
        batch: trainee.batch,
        hostelId: trainee.hostelId || "h-1",
        hostelName: trainee.hostelName || "VAMNICOM Main Hostel",
        blockId: trainee.blockId || "blk-a",
        blockName: trainee.blockName || "Block A",
        roomId: trainee.roomId || "rm-a204",
        roomNumber: trainee.roomNumber || "A-204",
        bedNumber: trainee.bedNumber || "02",
        date,
        status,
        markedBy,
        markedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        remarks,
      });
    }

    this.recalculateStats();
    this.persist();
    return true;
  }

  // Trainee Specific Actions
  public submitHostelRequest(data: {
    traineeId: string;
    requestedHostel: string;
    roomPreference: any;
    acPreference: boolean;
    specialRequirement: string;
    reason: string;
  }): HostelRequest {
    const trainee = this.state.trainees.find((t) => t.id === data.traineeId) || DEMO_TRAINEE_RAVINDRA;
    const newReq: HostelRequest = {
      id: `req-${Date.now()}`,
      requestId: `HR-${Math.floor(1050 + Math.random() * 8900)}`,
      traineeId: trainee.id,
      traineeName: trainee.fullName,
      traineeCode: trainee.traineeCode,
      programme: trainee.programme,
      batch: trainee.batch,
      gender: trainee.gender,
      trainingStart: trainee.trainingStart || "12 Oct 2026",
      trainingEnd: trainee.trainingEnd || "25 Oct 2026",
      requestedHostel: data.requestedHostel,
      requestedHostelId: data.requestedHostel.includes("Women") ? "h-2" : "h-1",
      roomPreference: data.roomPreference,
      acPreference: data.acPreference,
      specialRequirement: data.specialRequirement,
      reason: data.reason,
      submittedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      status: "Pending",
    };

    this.state.requests.unshift(newReq);
    trainee.hostelStatus = "Pending";
    trainee.specialRequirement = data.specialRequirement;
    this.recalculateStats();
    this.persist();
    return newReq;
  }

  // Batch Specific Filter for Trainer
  public getBatchTrainees(batch: string): TraineeProfile[] {
    return this.state.trainees.filter((t) => t.batch === batch);
  }

  public getBatchHostelSummary(batch: string) {
    const trainees = this.getBatchTrainees(batch);
    const stayingInHostel = trainees.filter((t) => t.hostelStatus !== "Not Applied" && t.hostelRequired).length;
    const dayScholars = trainees.length - stayingInHostel;
    const checkedIn = trainees.filter((t) => t.checkInStatus === "Checked In").length;
    const onLeave = trainees.filter((t) => t.checkInStatus === "On Leave").length;
    const pendingAllocation = trainees.filter((t) => t.hostelStatus === "Pending" || t.hostelStatus === "Approved").length;

    return {
      totalTrainees: trainees.length,
      stayingInHostel,
      dayScholars,
      checkedIn,
      onLeave,
      pendingAllocation,
      occupancyPercent: stayingInHostel > 0 ? Math.round((checkedIn / stayingInHostel) * 100) : 0,
    };
  }

  private recalculateStats() {
    const occupied = this.state.beds.filter((b) => b.status === "OCCUPIED").length;
    const available = this.state.beds.filter((b) => b.status === "AVAILABLE").length;
    const maintenance = this.state.beds.filter((b) => b.status === "MAINTENANCE").length;
    const reserved = this.state.beds.filter((b) => b.status === "RESERVED").length;
    const total = this.state.beds.length;

    this.state.stats.occupiedBeds = occupied;
    this.state.stats.availableBeds = available;
    this.state.stats.maintenanceBeds = maintenance;
    this.state.stats.reservedBeds = reserved;
    this.state.stats.pendingRequests = this.state.requests.filter((r) => r.status === "Pending").length;
    this.state.stats.overallOccupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 74;
  }
}

// Singleton export
export const hostelService = new HostelService();
