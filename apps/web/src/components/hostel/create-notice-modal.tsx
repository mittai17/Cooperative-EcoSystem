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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Pin } from "lucide-react";
import { hostelService } from "@/lib/hostel/hostel-service";
import type { NoticeCategory } from "@/lib/hostel/types";

interface CreateNoticeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateNoticeModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateNoticeModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("General");
  const [audience, setAudience] = useState("All Residents");
  const [description, setDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [priority, setPriority] = useState<"Normal" | "High" | "Urgent">("Normal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    hostelService.createNotice({
      title,
      category,
      audience,
      hostelName: "VAMNICOM Main Hostel",
      description,
      priority,
      isPinned,
    });

    setTitle("");
    setDescription("");
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 sm:rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Bell className="size-5 text-primary" />
            Publish Hostel Notice / Directive
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs">Notice Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mess Timing Update or Gate Closing Rules"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Mess">Mess & Dining</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Check-in">Check-in</SelectItem>
                  <SelectItem value="Check-out">Check-out</SelectItem>
                  <SelectItem value="Discipline">Discipline</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Audience</Label>
              <Select value={audience} onValueChange={(v) => v && setAudience(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Residents">All Residents</SelectItem>
                  <SelectItem value="Block A & B Residents">Block A & B Residents</SelectItem>
                  <SelectItem value="Women's Wing Residents">Women&apos;s Wing Residents</SelectItem>
                  <SelectItem value="All Trainees">All Trainees</SelectItem>
                  <SelectItem value="Trainers & Wardens">Trainers & Wardens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notice Content</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter directive, instructions, or advisory details..."
              className="h-24 text-xs"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pin-notice"
                checked={isPinned}
                onCheckedChange={(c) => setIsPinned(Boolean(c))}
              />
              <Label htmlFor="pin-notice" className="text-xs font-medium cursor-pointer flex items-center gap-1">
                <Pin className="size-3 text-primary" /> Pin notice to top
              </Label>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Priority:</span>
              <button
                type="button"
                onClick={() => setPriority(priority === "Normal" ? "High" : "Normal")}
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  priority === "High" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
                }`}
              >
                {priority}
              </button>
            </div>
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="ghost" type="button" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold">
              Publish Notice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
