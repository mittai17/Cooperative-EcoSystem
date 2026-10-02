"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  ChevronRight,
  MapPin,
  Users,
  Bed,
  DoorOpen,
  Eye,
  Settings,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { hostelService } from "@/lib/hostel/hostel-service";
import { AddHostelModal } from "@/components/hostel/add-hostel-modal";

export default function HostelsAndBlocksPage() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "partial" | "full" | "maintenance">("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const hostels = hostelService.getHostels();
  const blocks = hostelService.getBlocks();

  const filteredHostels = hostels.filter((h) => {
    if (activeTab === "active") return h.status === "Active";
    if (activeTab === "partial") return h.status === "Partially Occupied";
    if (activeTab === "full") return h.status === "Full";
    if (activeTab === "maintenance") return h.status === "Maintenance";
    return true;
  });

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
            <span className="text-foreground font-semibold">Hostels & Blocks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Hostels & Blocks Master
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Institutional residential campus facilities, wing breakdown, and warden leadership.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setAddModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs self-start sm:self-auto"
        >
          <Plus className="size-3.5 mr-1" /> Add Hostel
        </Button>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1.5 border-b pb-2 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
            activeTab === "all" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All Hostels ({hostels.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
            activeTab === "active" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Active (4)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("partial")}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
            activeTab === "partial" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Partially Occupied (1)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("full")}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
            activeTab === "full" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Full (0)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("maintenance")}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
            activeTab === "maintenance" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Maintenance (0)
        </button>
      </div>

      {/* HOSTELS GRID (MATCHING IMAGE 2 PANEL 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredHostels.map((h) => (
          <div
            key={h.id}
            className="rounded-2xl border bg-card p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-4">
                <div className="size-20 rounded-xl overflow-hidden border shrink-0">
                  <img src={h.photoUrl} alt={h.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-foreground truncate font-heading">{h.name}</h3>
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] shrink-0"
                    >
                      {h.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{h.code}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3 text-primary" /> {h.location}
                    </span>
                    <span>&bull; {h.gender}</span>
                  </div>
                </div>
              </div>

              {/* STATS ROW */}
              <div className="grid grid-cols-5 gap-2 text-center pt-4 pb-2 border-t border-b my-4 text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">Blocks</div>
                  <div className="font-bold text-sm text-foreground">{h.blocksCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">Rooms</div>
                  <div className="font-bold text-sm text-foreground">{h.roomsCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">Beds</div>
                  <div className="font-bold text-sm text-foreground">{h.bedsCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">Occupied</div>
                  <div className="font-bold text-sm text-red-600">{h.occupiedBeds}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">Available</div>
                  <div className="font-bold text-sm text-emerald-600">{h.availableBeds}</div>
                </div>
              </div>

              {/* OCCUPANCY BAR */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Occupancy Rate</span>
                  <span className="text-primary">{h.occupancyRate}%</span>
                </div>
                <Progress value={h.occupancyRate} className="h-2 bg-muted/50" />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-between pt-4 border-t mt-4 gap-2">
              <Button variant="outline" size="sm" className="text-xs flex-1">
                <Eye className="size-3.5 mr-1" /> View
              </Button>
              <Button variant="outline" size="sm" className="text-xs flex-1">
                <Layers className="size-3.5 mr-1 text-primary" /> Manage Blocks
              </Button>
              <Button
                render={<Link href="/institution/hostel/rooms" />}
                size="sm"
                variant="default"
                className="text-xs flex-1 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                <DoorOpen className="size-3.5 mr-1" /> Manage Rooms
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AddHostelModal open={addModalOpen} onOpenChange={setAddModalOpen} />
    </div>
  );
}
