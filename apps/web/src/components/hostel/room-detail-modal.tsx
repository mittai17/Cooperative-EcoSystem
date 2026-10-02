"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  BedDouble,
  Wifi,
  Bath,
  Wind,
  BookOpen,
  DoorClosed,
  CheckCircle2,
  Wrench,
  UserPlus,
} from "lucide-react";
import { hostelService } from "@/lib/hostel/hostel-service";
import type { Room } from "@/lib/hostel/types";

interface RoomDetailModalProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllocateBed?: (bedNumber: string) => void;
}

export function RoomDetailModal({
  room,
  open,
  onOpenChange,
  onAllocateBed,
}: RoomDetailModalProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!room) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMarkMaintenance = () => {
    showToast(`Room ${room.roomNumber} status updated to Under Maintenance`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-6 sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Room {room.roomNumber} &mdash; Details & Bed Allocation
          </DialogTitle>
        </DialogHeader>

        {toastMessage && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            {toastMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-2">
          {/* LEFT: Room photo & specs */}
          <div className="md:col-span-7 space-y-4">
            <div className="relative h-48 w-full overflow-hidden rounded-xl border">
              <img
                src="/vamnicom-campus.jpg"
                alt="Room Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 flex gap-1.5">
                <Badge className="bg-background/90 text-foreground font-bold shadow-xs">
                  {room.roomType}
                </Badge>
                <Badge
                  className={
                    room.status === "Available"
                      ? "bg-emerald-500 text-white"
                      : room.status === "Full"
                      ? "bg-red-500 text-white"
                      : "bg-amber-500 text-white"
                  }
                >
                  {room.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2.5 text-xs">
              <div>
                <span className="text-muted-foreground block">Hostel:</span>
                <span className="font-semibold text-foreground">{room.hostelName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Block:</span>
                <span className="font-semibold text-foreground">{room.blockName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Floor:</span>
                <span className="font-semibold text-foreground">{room.floor}nd Floor</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Total Capacity:</span>
                <span className="font-semibold text-foreground">{room.capacity} Beds</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Current Occupancy:</span>
                <span className="font-bold text-primary">
                  {room.occupied} / {room.capacity} ({Math.round((room.occupied / room.capacity) * 100)}%)
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">AC / Non-AC:</span>
                <span className="font-semibold text-foreground">{room.ac ? "AC" : "Non-AC"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Attached Bathroom:</span>
                <span className="font-semibold text-foreground">{room.attachedBathroom ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Gender:</span>
                <span className="font-semibold text-foreground">{room.gender}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={() => onAllocateBed?.("01")}
                className="bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                <UserPlus className="size-3.5 mr-1" /> Allocate Bed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkMaintenance}
                className="text-xs"
              >
                <Wrench className="size-3.5 mr-1" /> Mark Maintenance
              </Button>
            </div>
          </div>

          {/* RIGHT: Room Facilities */}
          <div className="md:col-span-5 space-y-3">
            <h4 className="font-bold text-sm text-foreground">Room Facilities</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border bg-muted/20 flex items-center gap-2">
                <Wifi className="size-4 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Wi-Fi</div>
                  <div className="text-[10px] text-muted-foreground">Available</div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/20 flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Study Table</div>
                  <div className="text-[10px] text-muted-foreground">4 Attached</div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/20 flex items-center gap-2">
                <Bath className="size-4 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Attached Bath</div>
                  <div className="text-[10px] text-muted-foreground">Hot water 24x7</div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/20 flex items-center gap-2">
                <Wind className="size-4 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Ceiling Fan</div>
                  <div className="text-[10px] text-muted-foreground">2 Units</div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg border bg-muted/20 flex items-center gap-2">
                <DoorClosed className="size-4 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Wardrobe</div>
                  <div className="text-[10px] text-muted-foreground">Individual Lock</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-xl border mt-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Location & Proximity</p>
              <p className="text-[11px] mt-0.5">
                Situated 200m from Academic Block & Training Hall 3. Near cafeteria and drinking water station.
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM: Bed Allocation Grid */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="font-bold text-sm text-foreground">Bed Allocation Map</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {room.beds.map((b) => {
              const isOccupied = b.status === "OCCUPIED";

              return (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isOccupied ? "bg-muted/30 border-border" : "bg-card border-dashed border-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{b.bedNumber}</span>
                    <Badge
                      variant="outline"
                      className={
                        isOccupied
                          ? "bg-red-50 text-red-700 border-red-200 text-[10px]"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                      }
                    >
                      {isOccupied ? "Occupied" : "Available"}
                    </Badge>
                  </div>

                  <div className="my-2">
                    {isOccupied ? (
                      <div>
                        <div className="font-semibold text-xs text-foreground truncate">
                          {b.traineeName || "Occupant"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Active Resident</div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No occupant assigned</div>
                    )}
                  </div>

                  <div className="pt-2 border-t flex justify-end">
                    {isOccupied ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showToast(`Viewing resident details for ${b.traineeName}`)}
                        className="h-7 text-xs text-primary"
                      >
                        View
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onAllocateBed?.(b.bedNumber)}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        Allocate
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
