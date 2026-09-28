"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Building2,
  CircleAlert,
  DoorOpen,
  Hammer,
  Home,
  Inbox,
  LogOut,
  RefreshCw,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type LoadState = "loading" | "ready" | "error";
type RoomStatus = "Occupied" | "Vacant" | "Maintenance";
type StatusFilter = RoomStatus | "All";

interface HostelRoom {
  id: string;
  code: string;
  blockId: string;
  floor: number;
  capacity: number;
  status: RoomStatus;
  occupant: string | null;
  occupantProgramme: string | null;
  checkIn: string | null;
  checkOut: string | null;
  note: string | null;
}

interface HostelBlock {
  id: string;
  name: string;
  kind: "Boys" | "Girls";
  floors: number[];
}

interface WaitlistEntry {
  id: string;
  name: string;
  programme: string;
  appliedOn: string;
  daysWaiting: number;
  preference: string;
}

interface HostelData {
  blocks: HostelBlock[];
  rooms: HostelRoom[];
  waitlist: WaitlistEntry[];
}

const STATUS_FILTERS: StatusFilter[] = ["All", "Occupied", "Vacant", "Maintenance"];

const STATUS_TONE: Record<RoomStatus, string> = {
  Occupied: "bg-success/10 text-success",
  Vacant: "bg-primary/10 text-primary",
  Maintenance: "bg-warning/10 text-warning",
};

const DOT_TONE: Record<RoomStatus, string> = {
  Occupied: "bg-success",
  Vacant: "bg-primary",
  Maintenance: "bg-warning",
};

const TILE_TONE: Record<RoomStatus, string> = {
  Occupied: "border-success/30 bg-success/5 hover:bg-success/10",
  Vacant: "border-border bg-card hover:bg-muted/60",
  Maintenance: "border-warning/40 bg-warning/5 hover:bg-warning/10",
};

interface VacatedRecord {
  roomCode: string;
  occupant: string;
  programme: string;
  vacatedOn: string;
}

async function loadHostel(): Promise<HostelData> {
  const res = await fetch(`${API_BASE}/api/v1/hostel/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

async function postAction(path: string, body?: unknown): Promise<HostelRoom> {
  const res = await fetch(`${API_BASE}/api/v1/hostel${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({ detail: "Request failed" })) as { detail?: string };
    throw new Error(json.detail ?? `API Error: ${res.status}`);
  }
  return res.json();
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function HostelPage() {
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [vacated, setVacated] = useState<VacatedRecord[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [openRoomId, setOpenRoomId] = useState<string | null>(null);
  const [allocationChoice, setAllocationChoice] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const openRoom = rooms.find((room) => room.id === openRoomId) ?? null;
  const vacantRooms = rooms.filter((room) => room.status === "Vacant");

  async function refresh() {
    setLoadState("loading");
    try {
      const next = await loadHostel();
      setBlocks(next.blocks);
      setRooms(next.rooms);
      setWaitlist(next.waitlist);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(
    () => ({
      total: rooms.length,
      occupied: rooms.filter((room) => room.status === "Occupied").length,
      vacant: rooms.filter((room) => room.status === "Vacant").length,
      maintenance: rooms.filter((room) => room.status === "Maintenance").length,
    }),
    [rooms],
  );

  const counts: Record<StatusFilter, number> = {
    All: stats.total,
    Occupied: stats.occupied,
    Vacant: stats.vacant,
    Maintenance: stats.maintenance,
  };

  const allocationRows = useMemo(
    () =>
      rooms
        .filter((room) => room.status === "Occupied" && room.occupant && room.checkIn && room.checkOut)
        .sort((a, b) => a.code.localeCompare(b.code)),
    [rooms],
  );

  const blockName = (blockId: string) =>
    blocks.find((block) => block.id === blockId)?.name ?? `Block ${blockId}`;

  function resetNotice() {
    setNotice(null);
    setOpenRoomId(null);
    setAllocationChoice(null);
  }

  async function checkOut(room: HostelRoom) {
    const occupant = room.occupant;
    if (!occupant) return;
    setActionPending(true);
    try {
      const updated = await postAction(`/rooms/${room.id}/check-out`);
      setRooms((prev) => prev.map((item) => (item.id === room.id ? updated : item)));
      setVacated((prev) => [
        {
          roomCode: room.code,
          occupant,
          programme: room.occupantProgramme ?? "Programme not on record",
          vacatedOn: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);
      setNotice(`${occupant} checked out of ${room.code}. The bed is now vacant.`);
      setOpenRoomId(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not check out this room.");
    } finally {
      setActionPending(false);
    }
  }

  async function markMaintenance(room: HostelRoom) {
    setActionPending(true);
    try {
      const updated = await postAction(`/rooms/${room.id}/maintenance`);
      setRooms((prev) => prev.map((item) => (item.id === room.id ? updated : item)));
      setNotice(
        room.occupant
          ? `${room.code} moved to maintenance and ${room.occupant} was moved to the waitlist.`
          : `${room.code} moved to maintenance.`,
      );
      if (room.occupant) {
        const next = await loadHostel();
        setWaitlist(next.waitlist);
      }
      setOpenRoomId(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not update this room.");
    } finally {
      setActionPending(false);
    }
  }

  async function returnToService(room: HostelRoom) {
    setActionPending(true);
    try {
      const updated = await postAction(`/rooms/${room.id}/return-to-service`);
      setRooms((prev) => prev.map((item) => (item.id === room.id ? updated : item)));
      setNotice(`${room.code} returned to service and is available for allocation.`);
      setOpenRoomId(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not update this room.");
    } finally {
      setActionPending(false);
    }
  }

  async function allocate(waitlistId: string, roomId: string) {
    const person = waitlist.find((entry) => entry.id === waitlistId);
    const room = rooms.find((item) => item.id === roomId);
    if (!person || !room || room.status !== "Vacant") return;
    setActionPending(true);
    try {
      const updated = await postAction("/allocate", { waitlist_id: waitlistId, room_id: roomId });
      setRooms((prev) => prev.map((item) => (item.id === roomId ? updated : item)));
      setWaitlist((prev) => prev.filter((entry) => entry.id !== waitlistId));
      setNotice(`${person.name} allocated to ${room.code} until ${formatDate(updated.checkOut)}.`);
      setOpenRoomId(null);
      setAllocationChoice(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not allocate this room.");
    } finally {
      setActionPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hostel Management"
        description="Occupancy, room condition and the accommodation waitlist for the residential campus."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="demo-data-tag">Live dataset · {stats.total} rooms</span>
            <Button
              variant="outline"
              onClick={refresh}
              disabled={loadState === "loading"}
              aria-label="Refresh hostel occupancy"
            >
              <RefreshCw className={loadState === "loading" ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        }
      />

      {notice && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <BedDouble className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm text-foreground">{notice}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total rooms"
          value={String(stats.total)}
          icon={Building2}
          trend={`${blocks.length} blocks on campus`}
          trendTone="neutral"
        />
        <StatCard
          label="Occupied"
          value={String(stats.occupied)}
          icon={Users}
          trend={`${Math.round((stats.occupied / Math.max(stats.total, 1)) * 100)}% of inventory`}
          trendTone="neutral"
        />
        <StatCard
          label="Vacant"
          value={String(stats.vacant)}
          icon={DoorOpen}
          trend={`${waitlist.length} on the waitlist`}
          trendTone={stats.vacant === 0 ? "down" : "up"}
        />
        <StatCard
          label="Maintenance"
          value={String(stats.maintenance)}
          icon={Wrench}
          trend={stats.maintenance > 0 ? "Beds blocked from allocation" : "No blocked beds"}
          trendTone={stats.maintenance > 0 ? "down" : "up"}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((item) => (
            <Button
              key={item}
              variant={statusFilter === item ? "secondary" : "outline"}
              size="sm"
              aria-pressed={statusFilter === item}
              onClick={() => setStatusFilter(item)}
            >
              {item}
              <span className="ml-1.5 font-mono text-xs">{counts[item]}</span>
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/70">
          {(["Occupied", "Vacant", "Maintenance"] as RoomStatus[]).map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", DOT_TONE[item])} aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {loadState === "error" ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">Could not load hostel inventory</p>
              <p className="mt-1 text-sm text-foreground/70">
                Room data did not resolve. Check your connection and try again.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            Try again
          </Button>
        </div>
      ) : loadState === "loading" ? (
        <Card>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 12 }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-lg" />
            ))}
          </CardContent>
        </Card>
      ) : blocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="icon-tile-red size-10">
              <Home className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">No hostel blocks on record</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-foreground/70">
                Nothing has been set up for this campus yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {blocks.map((block) => {
            const blockRooms = rooms.filter((room) => room.blockId === block.id);
            const occupied = blockRooms.filter((room) => room.status === "Occupied").length;
            return (
              <Card key={block.id}>
                <CardHeader className="border-b">
                  <CardTitle className="font-heading text-base">{block.name}</CardTitle>
                  <CardDescription>
                    {block.kind} block · {occupied} of {blockRooms.length} rooms occupied
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {block.floors.map((floor) => {
                    const floorRooms = blockRooms.filter(
                      (room) => room.floor === floor && (statusFilter === "All" || room.status === statusFilter),
                    );
                    return (
                      <div key={floor}>
                        <p className="mb-2 text-sm font-medium text-foreground">Floor {floor}</p>
                        {floorRooms.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-foreground/60">
                            No {statusFilter.toLowerCase()} rooms on floor {floor}.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3">
                            {floorRooms.map((room) => (
                              <RoomTile
                                key={room.id}
                                room={room}
                                onOpen={() => {
                                  setAllocationChoice(null);
                                  setOpenRoomId(room.id);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Current allocations</CardTitle>
            <CardDescription>
              Derived from live room state. Vacated beds drop out of this table as occupants check
              out.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {allocationRows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <span className="icon-tile-red size-10">
                  <Inbox className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">No active allocations</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-foreground/70">
                    Every bed is either vacant or blocked for maintenance. Allocate from the waitlist
                    to create a record.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trainee</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Block</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocationRows.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">{room.occupant}</p>
                          <p className="max-w-[240px] truncate text-xs text-foreground/60">
                            {room.occupantProgramme}
                          </p>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {room.code}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {blockName(room.blockId).replace(" Hostel", "")}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{formatDate(room.checkIn)}</TableCell>
                        <TableCell className="font-mono text-xs">{formatDate(room.checkOut)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={STATUS_TONE.Occupied}>
                            Checked in
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {vacated.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-sm font-medium text-foreground">Vacated this session</p>
                <ul className="flex flex-col gap-2">
                  {vacated.map((record) => (
                    <li
                      key={`${record.roomCode}-${record.vacatedOn}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                    >
                      <span className="font-medium text-foreground">{record.occupant}</span>
                      <span className="text-foreground/70">{record.programme}</span>
                      <span className="font-mono text-xs text-foreground/60">
                        {record.roomCode} · out {formatDate(record.vacatedOn)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Accommodation waitlist</CardTitle>
            <CardDescription>
              {waitlist.length} trainee{waitlist.length === 1 ? "" : "s"} waiting for a bed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {waitlist.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-10 text-center">
                <span className="icon-tile-red size-10">
                  <Home className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Waitlist is clear</p>
                  <p className="mx-auto mt-1 max-w-xs text-sm text-foreground/70">
                    Every trainee seeking accommodation has a bed. New requests from the admission
                    desk will land here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground/70">
                  {vacantRooms.length === 0
                    ? "No bed is currently available — clear a room or close a maintenance ticket to allocate."
                    : `${vacantRooms.length} bed${vacantRooms.length === 1 ? " is" : "s are"} available.`}
                </p>
                {waitlist.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{entry.name}</p>
                      <p className="truncate text-xs text-foreground/60">{entry.programme}</p>
                      <p className="mt-1 font-mono text-xs text-foreground/60">
                        waiting {entry.daysWaiting}d · {entry.preference}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={vacantRooms.length === 0 || actionPending}
                      onClick={() => {
                        const target = vacantRooms[0];
                        if (target) allocate(entry.id, target.id);
                      }}
                    >
                      <UserPlus className="mr-1.5 size-3.5" />
                      Allocate
                    </Button>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(openRoom)} onOpenChange={(open) => (open ? null : resetNotice())}>
        <DialogContent className="sm:max-w-md">
          {openRoom && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="font-mono">{openRoom.code}</DialogTitle>
                  <Badge variant="secondary" className={STATUS_TONE[openRoom.status]}>
                    {openRoom.status}
                  </Badge>
                </div>
                <DialogDescription>
                  {blockName(openRoom.blockId)} · Floor {openRoom.floor} · {openRoom.capacity} beds
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-2 gap-3">
                <Detail label="Occupant" value={openRoom.occupant ?? "No occupant"} />
                <Detail label="Programme" value={openRoom.occupantProgramme ?? "—"} />
                <Detail label="Check-in" value={formatDate(openRoom.checkIn)} mono />
                <Detail label="Check-out" value={formatDate(openRoom.checkOut)} mono />
                {openRoom.note && (
                  <div className="col-span-2">
                    <Detail label="Caretaker note" value={openRoom.note} />
                  </div>
                )}
              </dl>

              {openRoom.status === "Vacant" && waitlist.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  <p className="text-sm font-medium text-foreground">Allocate from the waitlist</p>
                  <Select
                    value={allocationChoice}
                    onValueChange={(value) => setAllocationChoice(String(value))}
                  >
                    <SelectTrigger size="sm" className="w-full" aria-label="Waitlisted trainee">
                      <SelectValue placeholder="Choose a trainee" />
                    </SelectTrigger>
                    <SelectContent>
                      {waitlist.map((entry) => (
                        <SelectItem key={entry.id} value={entry.id}>
                          {entry.name} · waiting {entry.daysWaiting}d
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {openRoom.status === "Vacant" && waitlist.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-3 text-sm text-foreground/70">
                  No one is on the waitlist, so this bed can only be allocated by a walk-in request
                  from the admission desk.
                </p>
              )}

              <DialogFooter className="flex-wrap">
                {openRoom.status === "Occupied" && (
                  <Button variant="destructive" disabled={actionPending} onClick={() => checkOut(openRoom)}>
                    <LogOut className="mr-1.5 size-3.5" />
                    Check out occupant
                  </Button>
                )}
                {openRoom.status === "Maintenance" ? (
                  <Button variant="outline" disabled={actionPending} onClick={() => returnToService(openRoom)}>
                    <Hammer className="mr-1.5 size-3.5" />
                    Return to service
                  </Button>
                ) : (
                  <Button variant="outline" disabled={actionPending} onClick={() => markMaintenance(openRoom)}>
                    <Wrench className="mr-1.5 size-3.5" />
                    Mark maintenance
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (allocationChoice) allocate(allocationChoice, openRoom.id);
                  }}
                  disabled={openRoom.status !== "Vacant" || !allocationChoice || actionPending}
                >
                  <UserPlus className="mr-1.5 size-3.5" />
                  Allocate bed
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoomTile({ room, onOpen }: { room: HostelRoom; onOpen: () => void }) {
  const sub = room.status === "Occupied" ? (room.occupant ?? "Occupied") : (room.note ?? "Available");
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${room.code}, ${room.status}. ${sub}`}
      className={cn(
        "flex flex-col rounded-lg border p-3 text-left transition-colors",
        TILE_TONE[room.status],
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-semibold text-foreground">{room.code}</span>
        <span
          className={cn("size-2 shrink-0 rounded-full", DOT_TONE[room.status])}
          aria-hidden="true"
        />
      </span>
      <span className="mt-1 font-mono text-[10px] tracking-wide text-foreground/60 uppercase">
        {room.status}
      </span>
      <span className="mt-0.5 truncate text-xs text-foreground/80">{sub}</span>
    </button>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-foreground/60">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 text-sm text-foreground",
          mono ? "font-mono text-xs font-medium" : "font-medium",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
