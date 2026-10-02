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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Plus } from "lucide-react";
import type { HostelGender } from "@/lib/hostel/types";

interface AddHostelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddHostelModal({ open, onOpenChange, onSuccess }: AddHostelModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [gender, setGender] = useState<HostelGender>("Mixed");
  const [blocks, setBlocks] = useState("2");
  const [rooms, setRooms] = useState("30");
  const [beds, setBeds] = useState("120");
  const [warden, setWarden] = useState("");
  const [phone, setPhone] = useState("+91 ");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 sm:rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Building2 className="size-5 text-primary" />
            Add New Hostel Master Record
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Hostel Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. North Campus Hostel"
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hostel Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. VAM-H06"
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Gender Classification</Label>
              <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                  <SelectItem value="Female">Female Only</SelectItem>
                  <SelectItem value="Male">Male Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Blocks Count</Label>
              <Input
                type="number"
                value={blocks}
                onChange={(e) => setBlocks(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Total Rooms</Label>
              <Input
                type="number"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Total Beds Capacity</Label>
              <Input
                type="number"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Chief Warden</Label>
              <Input
                value={warden}
                onChange={(e) => setWarden(e.target.value)}
                placeholder="e.g. Dr. A. K. Verma"
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Warden Contact</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="ghost" type="button" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold">
              <Plus className="size-4 mr-1" /> Add Hostel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
