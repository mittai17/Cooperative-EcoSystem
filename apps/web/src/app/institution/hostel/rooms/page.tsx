"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  DoorOpen,
  Plus,
  ChevronRight,
  Search,
  Filter,
  X,
  Eye,
  BedDouble,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hostelService } from "@/lib/hostel/hostel-service";
import { RoomDetailModal } from "@/components/hostel/room-detail-modal";
import { AllocateRoomModal } from "@/components/hostel/allocate-room-modal";
import type { Room } from "@/lib/hostel/types";

export default function RoomsAndBedsPage() {
  const rooms = hostelService.getRooms();

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedHostel, setSelectedHostel] = useState("all");
  const [selectedBlock, setSelectedBlock] = useState("all");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Room details modal
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (selectedBlock !== "all" && !r.blockName.toLowerCase().includes(selectedBlock.toLowerCase())) return false;
      if (selectedFloor !== "all" && r.floor !== Number(selectedFloor)) return false;
      if (selectedType !== "all" && r.roomType !== selectedType) return false;
      if (selectedStatus !== "all" && r.status !== selectedStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchRoom = r.roomNumber.toLowerCase().includes(q);
        const matchBlock = r.blockName.toLowerCase().includes(q);
        const matchTrainee = r.assignedTrainees.some((t) => t.name.toLowerCase().includes(q));
        if (!matchRoom && !matchBlock && !matchTrainee) return false;
      }
      return true;
    });
  }, [rooms, selectedBlock, selectedFloor, selectedType, selectedStatus, search]);

  const totalPages = Math.ceil(filteredRooms.length / rowsPerPage) || 1;
  const paginatedRooms = filteredRooms.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleOpenDetail = (r: Room) => {
    setDetailRoom(r);
    setDetailOpen(true);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedHostel("all");
    setSelectedBlock("all");
    setSelectedFloor("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>Home</span>
            <ChevronRight className="size-3" />
            <Link href="/institution/hostel" className="hover:text-primary">
              Hostel Management
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">Rooms & Beds</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Rooms & Beds Inventory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time occupancy status, bed matrices, and room specifications across all residential blocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setAllocateOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs"
          >
            <BedDouble className="size-3.5 mr-1" /> Allocate Room
          </Button>
        </div>
      </div>

      {/* FILTERS TOOLBAR (MATCHING IMAGE 2 PANEL 3) */}
      <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Hostel */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Hostel</label>
            <Select value={selectedHostel} onValueChange={(v) => v && setSelectedHostel(v)}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Hostel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                <SelectItem value="main">VAMNICOM Main</SelectItem>
                <SelectItem value="women">Women&apos;s Hostel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Block */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Block</label>
            <Select value={selectedBlock} onValueChange={(v) => { if(v) { setSelectedBlock(v); setPage(1); } }}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Block" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blocks</SelectItem>
                <SelectItem value="Block A">Block A</SelectItem>
                <SelectItem value="Block B">Block B</SelectItem>
                <SelectItem value="Block C">Block C</SelectItem>
                <SelectItem value="Block D">Block D</SelectItem>
                <SelectItem value="Block E">Block E</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Floor */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Floor</label>
            <Select value={selectedFloor} onValueChange={(v) => { if(v) { setSelectedFloor(v); setPage(1); } }}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                <SelectItem value="1">1st Floor</SelectItem>
                <SelectItem value="2">2nd Floor</SelectItem>
                <SelectItem value="3">3rd Floor</SelectItem>
                <SelectItem value="4">4th Floor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Room Type */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Room Type</label>
            <Select value={selectedType} onValueChange={(v) => { if(v) { setSelectedType(v); setPage(1); } }}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Double">Double (2)</SelectItem>
                <SelectItem value="4 Sharing">4 Sharing</SelectItem>
                <SelectItem value="6 Sharing">6 Sharing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Status</label>
            <Select value={selectedStatus} onValueChange={(v) => { if(v) { setSelectedStatus(v); setPage(1); } }}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Partially Occupied">Partially Occupied</SelectItem>
                <SelectItem value="Full">Full</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="h-8.5 text-xs w-full text-muted-foreground hover:text-foreground"
            >
              <X className="size-3 mr-1" /> Clear Filters
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative pt-1">
          <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search room number (e.g. A-204), trainee name, or block..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* ROOMS TABLE (MATCHING IMAGE 2 PANEL 3) */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Room No.</th>
                <th className="py-3 px-4">Block</th>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Occupied</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Trainees</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedRooms.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-sm text-foreground font-mono">{r.roomNumber}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{r.blockName}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.floor}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.roomType}</td>
                  <td className="py-3 px-4 font-medium">{r.capacity}</td>
                  <td className="py-3 px-4 font-bold text-red-600">{r.occupied}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">{r.available}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={
                        r.status === "Available"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.status === "Full"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : r.status === "Maintenance"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex -space-x-1.5 items-center">
                      {r.assignedTrainees.slice(0, 3).map((t, idx) => (
                        <div
                          key={idx}
                          title={`${t.name} (${t.batch})`}
                          className="size-6 rounded-full bg-primary text-primary-foreground font-bold text-[9px] flex items-center justify-center border-2 border-background ring-1 ring-border"
                        >
                          {t.avatar}
                        </div>
                      ))}
                      {r.assignedTrainees.length > 3 && (
                        <span className="text-[10px] text-muted-foreground font-bold pl-2">
                          +{r.assignedTrainees.length - 3}
                        </span>
                      )}
                      {r.assignedTrainees.length === 0 && (
                        <span className="text-muted-foreground text-[11px] italic">Vacant</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDetail(r)}
                      className="h-7 px-2.5 text-xs text-primary border-primary/30 hover:bg-rose-50"
                    >
                      <Eye className="size-3 mr-1" /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-3.5 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * rowsPerPage + 1} to{" "}
            {Math.min(page * rowsPerPage, filteredRooms.length)} of {filteredRooms.length} rooms
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="h-7 text-xs"
            >
              Previous
            </Button>
            <span className="px-2 font-bold text-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL WITH BED MAP (IMAGE 2 PANEL 4) */}
      <RoomDetailModal
        room={detailRoom}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAllocateBed={() => {
          setDetailOpen(false);
          setAllocateOpen(true);
        }}
      />

      {/* ALLOCATE MODAL */}
      <AllocateRoomModal
        open={allocateOpen}
        onOpenChange={setAllocateOpen}
      />
    </div>
  );
}
