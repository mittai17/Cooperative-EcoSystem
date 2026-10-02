"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Check,
  CheckCircle2,
  Building2,
  BedDouble,
  Sparkles,
  Search,
  UserCheck,
} from "lucide-react";
import { hostelService } from "@/lib/hostel/hostel-service";
import type { TraineeProfile, Room, Bed } from "@/lib/hostel/types";

interface AllocateRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTraineeId?: string;
  onSuccess?: () => void;
}

export function AllocateRoomModal({
  open,
  onOpenChange,
  initialTraineeId,
  onSuccess,
}: AllocateRoomModalProps) {
  const [step, setStep] = useState<number>(initialTraineeId ? 2 : 1);
  const [searchQuery, setSearchQuery] = useState("");
  const trainees = hostelService.getTrainees();
  const rooms = hostelService.getRooms();

  // Selected state
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeProfile | null>(
    initialTraineeId ? hostelService.getTraineeById(initialTraineeId) || trainees[0] : trainees[0]
  );
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [isAllocating, setIsAllocating] = useState(false);

  // Recommended rooms for selected trainee
  const recommendedRooms = rooms
    .filter((r) => r.available > 0 && (selectedTrainee?.gender === "Female" ? r.gender === "Female" : true))
    .slice(0, 4);

  const handleSelectTrainee = (t: TraineeProfile) => {
    setSelectedTrainee(t);
    setSelectedRoom(null);
    setSelectedBed(null);
    setStep(2);
  };

  const handleSelectRoom = (r: Room) => {
    setSelectedRoom(r);
    const firstAvailableBed = r.beds.find((b) => b.status === "AVAILABLE");
    setSelectedBed(firstAvailableBed || null);
    setStep(3);
  };

  const handleConfirm = () => {
    if (!selectedTrainee || !selectedRoom || !selectedBed) return;
    setIsAllocating(true);
    setTimeout(() => {
      hostelService.allocateRoom(selectedTrainee.id, selectedRoom.id, selectedBed.id);
      setIsAllocating(false);
      onSuccess?.();
      onOpenChange(false);
      setStep(1);
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-6 sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Allocate Room to Trainee
          </DialogTitle>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 sm:gap-6 text-xs font-semibold">
              {[
                { s: 1, label: "Select Trainee" },
                { s: 2, label: "Room Options" },
                { s: 3, label: "Select Bed" },
                { s: 4, label: "Confirm" },
              ].map(({ s, label }) => (
                <div
                  key={s}
                  className={`flex items-center gap-1.5 ${
                    step === s
                      ? "text-primary font-bold"
                      : step > s
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60"
                  }`}
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs ${
                      step === s
                        ? "bg-primary text-primary-foreground font-bold"
                        : step > s
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s ? <Check className="size-3.5 stroke-[3]" /> : s}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* STEP 1: SELECT TRAINEE */}
        {step === 1 && (
          <div className="space-y-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search trainee by name, code or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[380px] overflow-y-auto divide-y rounded-xl border">
              {trainees
                .filter(
                  (t) =>
                    t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.traineeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.batch.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 15)
                .map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTrainee(t)}
                    className="flex items-center justify-between p-3.5 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {t.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{t.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.traineeCode} &bull; {t.programme} ({t.batch})
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={
                          t.hostelStatus === "Allocated"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : t.hostelStatus === "Pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }
                      >
                        {t.hostelStatus}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-8 text-primary font-semibold">
                        Select &rarr;
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* STEP 2: ROOM OPTIONS & RECOMMENDATIONS */}
        {step === 2 && selectedTrainee && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-3">
            {/* Left: Trainee Details */}
            <div className="md:col-span-5 rounded-xl border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="size-11 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-base">
                  {selectedTrainee.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{selectedTrainee.fullName}</h4>
                  <p className="text-xs text-muted-foreground">{selectedTrainee.traineeCode}</p>
                </div>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="font-medium text-foreground">{selectedTrainee.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Programme:</span>
                  <span className="font-medium text-foreground text-right">{selectedTrainee.programme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch:</span>
                  <span className="font-medium text-foreground">{selectedTrainee.batch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Training Dates:</span>
                  <span className="font-medium text-foreground">
                    {selectedTrainee.trainingStart} - {selectedTrainee.trainingEnd}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hostel Preference:</span>
                  <span className="font-medium text-foreground">Main Hostel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Preference:</span>
                  <span className="font-medium text-foreground">4 Sharing</span>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground block mb-1">Special Requirement:</span>
                  <span className="bg-amber-50 text-amber-800 p-2 rounded-md block text-[11px]">
                    {selectedTrainee.specialRequirement || "Non-AC, Ground or 2nd Floor (if possible)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Recommended Rooms */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary" />
                  Recommended Available Rooms
                </h4>
                <span className="text-xs text-muted-foreground">{recommendedRooms.length} matched</span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {recommendedRooms.map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:border-primary/50 transition-all shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">{r.roomNumber}</span>
                        {i === 0 && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] px-1.5 py-0 font-bold">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.blockName}, {r.floor}nd Floor &bull; {r.roomType}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                        <span className="text-emerald-600 font-semibold">{r.available} beds available</span>
                        <span>&bull; Near Training Hall (200m)</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSelectRoom(r)}
                      className="h-8 font-semibold bg-primary hover:bg-primary/90 text-white"
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SELECT BED */}
        {step === 3 && selectedRoom && (
          <div className="space-y-4 py-3">
            <div className="bg-muted/30 p-3.5 rounded-xl flex items-center justify-between border">
              <div>
                <span className="text-xs text-muted-foreground">Selected Room</span>
                <h4 className="font-bold text-base text-foreground">
                  Room {selectedRoom.roomNumber} &bull; {selectedRoom.blockName}
                </h4>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                Change Room
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedRoom.beds.map((bed) => {
                const isOccupied = bed.status === "OCCUPIED";
                const isSelected = selectedBed?.id === bed.id;

                return (
                  <div
                    key={bed.id}
                    onClick={() => !isOccupied && setSelectedBed(bed)}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isOccupied
                        ? "bg-muted/40 border-dashed opacity-75 cursor-not-allowed"
                        : isSelected
                        ? "bg-rose-50 border-primary ring-2 ring-primary/20 cursor-pointer shadow-xs"
                        : "bg-card hover:border-primary/40 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <BedDouble className={`size-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
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
                    <div className="mt-4">
                      <div className="font-bold text-foreground text-sm">{bed.bedNumber}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {isOccupied ? bed.traineeName || "Occupant" : "Ready for allocation"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMATION */}
        {step === 4 && selectedTrainee && selectedRoom && selectedBed && (
          <div className="space-y-4 py-3">
            <div className="rounded-xl border bg-emerald-50/50 p-4 border-emerald-200 space-y-3">
              <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                Review & Confirm Room Allocation
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-muted-foreground block">Trainee Name:</span>
                  <span className="font-semibold text-foreground">{selectedTrainee.fullName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Trainee Code:</span>
                  <span className="font-semibold text-foreground">{selectedTrainee.traineeCode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Batch / Programme:</span>
                  <span className="font-semibold text-foreground">
                    {selectedTrainee.batch} ({selectedTrainee.programme})
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Allocated Room & Bed:</span>
                  <span className="font-bold text-primary">
                    Room {selectedRoom.roomNumber} ({selectedBed.bedNumber})
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Hostel & Block:</span>
                  <span className="font-semibold text-foreground">
                    {selectedRoom.hostelName}, {selectedRoom.blockName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Check-in Duration:</span>
                  <span className="font-semibold text-foreground">
                    {selectedTrainee.trainingStart} to {selectedTrainee.trainingEnd}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4 flex items-center justify-between sm:justify-between">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step < 3 && (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !selectedTrainee}
                className="bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                Next &rarr;
              </Button>
            )}
            {step === 3 && (
              <Button
                onClick={() => setStep(4)}
                disabled={!selectedBed}
                className="bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                Proceed to Confirm &rarr;
              </Button>
            )}
            {step === 4 && (
              <Button
                onClick={handleConfirm}
                disabled={isAllocating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isAllocating ? "Allocating Bed..." : "Confirm & Allocate Bed"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
