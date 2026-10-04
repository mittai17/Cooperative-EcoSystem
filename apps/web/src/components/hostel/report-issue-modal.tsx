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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wrench, CheckCircle2, AlertTriangle } from "lucide-react";
import { hostelService } from "@/lib/hostel/hostel-service";
import type { MaintenanceCategory, PriorityLevel } from "@/lib/hostel/types";

interface ReportIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLocation?: string;
  defaultReporter?: string;
  reporterRole?: string;
  onSuccess?: () => void;
}

export function ReportIssueModal({
  open,
  onOpenChange,
  defaultLocation = "Room A-204",
  defaultReporter = "Ravindra Suresh Patil",
  reporterRole = "Trainee",
  onSuccess,
}: ReportIssueModalProps) {
  const [category, setCategory] = useState<MaintenanceCategory>("Wi-Fi");
  const [location, setLocation] = useState(defaultLocation);
  const [priority, setPriority] = useState<PriorityLevel>("High");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      hostelService.reportMaintenanceIssue({
        category,
        location,
        hostelId: "h-1",
        hostelName: "VAMNICOM Main Hostel",
        blockName: "Block A",
        roomNumber: location,
        priority,
        description,
        reportedBy: defaultReporter,
        reportedByRole: reporterRole,
      });

      setSubmitting(false);
      setDescription("");
      onSuccess?.();
      onOpenChange(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 sm:rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Wrench className="size-5 text-primary" />
            Report Hostel Maintenance Issue
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v as MaintenanceCategory)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                  <SelectItem value="Wi-Fi">Wi-Fi & Network</SelectItem>
                  <SelectItem value="HVAC">HVAC / Cooling</SelectItem>
                  <SelectItem value="Bathroom">Bathroom</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v as PriorityLevel)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Location / Room Number</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Room A-204 or Block B 2nd floor"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Issue Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the defect, breakdown, or problem in detail..."
              className="h-24 text-xs"
              required
            />
          </div>

          <div className="p-2.5 bg-muted/20 rounded-lg text-muted-foreground text-[11px] flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500 shrink-0" />
            <span>High/Critical issues are instantly forwarded to duty maintenance engineers.</span>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="ghost" type="button" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !description.trim()}
              className="bg-primary hover:bg-primary/90 text-white font-bold"
            >
              {submitting ? "Submitting..." : "Submit Issue Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
