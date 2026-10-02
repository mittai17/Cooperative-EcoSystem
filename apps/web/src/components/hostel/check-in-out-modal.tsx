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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LogIn, LogOut, CheckCircle2, ShieldCheck, Key } from "lucide-react";
import { hostelService } from "@/lib/hostel/hostel-service";
import type { TraineeProfile } from "@/lib/hostel/types";

interface CheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainee: TraineeProfile | null;
  onSuccess?: () => void;
}

export function CheckInModal({
  open,
  onOpenChange,
  trainee,
  onSuccess,
}: CheckInModalProps) {
  const [idVerified, setIdVerified] = useState(true);
  const [rulesAccepted, setRulesAccepted] = useState(true);
  const [emergencyConfirmed, setEmergencyConfirmed] = useState(true);
  const [dutyWarden, setDutyWarden] = useState("Mr. S. Deshmukh (Duty Warden)");

  if (!trainee) return null;

  const handleCheckIn = () => {
    hostelService.checkInTrainee(trainee.id, dutyWarden);
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 sm:rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-emerald-700">
            <LogIn className="size-5" />
            Trainee Check-in Desk
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="p-3 bg-muted/20 rounded-xl border">
            <div className="font-bold text-sm text-foreground">{trainee.fullName}</div>
            <div className="text-muted-foreground mt-0.5">
              Code: {trainee.traineeCode} &bull; Batch: {trainee.batch}
            </div>
            <div className="mt-2 text-xs font-semibold text-primary">
              Allotted Room: {trainee.roomNumber || "A-204"} ({trainee.bedNumber || "Bed 02"})
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="id-verify"
                checked={idVerified}
                onCheckedChange={(c) => setIdVerified(Boolean(c))}
              />
              <Label htmlFor="id-verify" className="text-xs font-medium cursor-pointer">
                Government Photo ID verified (Aadhaar / Voter ID / Society Card)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rules-accept"
                checked={rulesAccepted}
                onCheckedChange={(c) => setRulesAccepted(Boolean(c))}
              />
              <Label htmlFor="rules-accept" className="text-xs font-medium cursor-pointer">
                Trainee signed Hostel Code of Conduct & 10:00 PM curfew rule
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emergency-verify"
                checked={emergencyConfirmed}
                onCheckedChange={(c) => setEmergencyConfirmed(Boolean(c))}
              />
              <Label htmlFor="emergency-verify" className="text-xs font-medium cursor-pointer">
                Emergency contact confirmed: {trainee.emergencyContact}
              </Label>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t">
            <Label className="text-[11px] text-muted-foreground">Duty Warden / Verifying Officer:</Label>
            <Input
              value={dutyWarden}
              onChange={(e) => setDutyWarden(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCheckIn}
            disabled={!idVerified || !rulesAccepted}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <CheckCircle2 className="size-4 mr-1" /> Complete Check-In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CheckOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainee: TraineeProfile | null;
  onSuccess?: () => void;
}

export function CheckOutModal({
  open,
  onOpenChange,
  trainee,
  onSuccess,
}: CheckOutModalProps) {
  const [keysReturned, setKeysReturned] = useState(true);
  const [inspectionPassed, setInspectionPassed] = useState(true);
  const [noPendingDues, setNoPendingDues] = useState(true);

  if (!trainee) return null;

  const handleCheckOut = () => {
    hostelService.checkOutTrainee(trainee.id);
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 sm:rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-700">
            <LogOut className="size-5" />
            Trainee Check-out & Key Clearance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="p-3 bg-muted/20 rounded-xl border">
            <div className="font-bold text-sm text-foreground">{trainee.fullName}</div>
            <div className="text-muted-foreground mt-0.5">
              Releasing Room: {trainee.roomNumber || "A-204"} ({trainee.bedNumber || "Bed 02"})
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="keys-return"
                checked={keysReturned}
                onCheckedChange={(c) => setKeysReturned(Boolean(c))}
              />
              <Label htmlFor="keys-return" className="text-xs font-medium cursor-pointer">
                Room & Wardrobe keys returned to reception desk
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="inspect-pass"
                checked={inspectionPassed}
                onCheckedChange={(c) => setInspectionPassed(Boolean(c))}
              />
              <Label htmlFor="inspect-pass" className="text-xs font-medium cursor-pointer">
                Room inventory inspection passed (No property damages reported)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dues-clear"
                checked={noPendingDues}
                onCheckedChange={(c) => setNoPendingDues(Boolean(c))}
              />
              <Label htmlFor="dues-clear" className="text-xs font-medium cursor-pointer">
                Mess and accommodation clearances verified
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCheckOut}
            disabled={!keysReturned || !inspectionPassed}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            <Key className="size-4 mr-1" /> Release Bed & Check-Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
