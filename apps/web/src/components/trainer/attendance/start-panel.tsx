"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, QrCode, ScanFace } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trainerPost } from "@/lib/trainer/api";
import type { Options, SlotItem } from "./types";

type Method = "qr" | "manual";

export function MethodPicker({ value, onChange }: { value: Method; onChange: (m: Method) => void }) {
  const [faceOpen, setFaceOpen] = useState(false);
  const cards: { id: Method | "face"; title: string; hint: string; icon: typeof QrCode }[] = [
    { id: "qr", title: "QR Code", hint: "Trainees scan a rotating QR from the app", icon: QrCode },
    { id: "manual", title: "Manual", hint: "Mark each trainee yourself", icon: ClipboardList },
    { id: "face", title: "Face Recognition", hint: "Integration-ready (kiosk)", icon: ScanFace },
  ];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Attendance method">
        {cards.map((c) => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => (c.id === "face" ? setFaceOpen(true) : onChange(c.id))}
              className={cn(
                "flex items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-muted/40",
                active ? "border-primary ring-2 ring-primary/20" : "border-border/60"
              )}
            >
              <span className={cn("rounded-xl p-2", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                <c.icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{c.title}</span>
                <span className="block text-xs text-muted-foreground">{c.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      <Dialog open={faceOpen} onOpenChange={setFaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Face recognition attendance</DialogTitle>
            <DialogDescription>
              Face matching is integration-ready: the platform already stores face templates and accepts{" "}
              <code>face</code> as an allowed method on sessions, with a match confidence per record. Capture runs on the
              classroom kiosk, which marks trainees against the same session roster. This web console does not capture
              video itself.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaceOpen(false)}>
              Close
            </Button>
            <Link href="/kiosk/attendance" className={buttonVariants()}>
              Open attendance kiosk
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

async function startSession(
  router: ReturnType<typeof useRouter>,
  body: { slot_id?: string; batch_id?: string; course_id?: string },
  method: Method
) {
  const res = await trainerPost<{ id: string }>("/attendance/session", {
    ...body,
    valid_minutes: 15,
    methods: method === "qr" ? ["qr", "manual"] : ["manual"],
  });
  router.push(`/trainer/attendance/session/${res.id}?mode=${method}`);
}

/** Dialog opened from a timetable slot card. */
export function StartSlotDialog({ slot, onClose }: { slot: SlotItem | null; onClose: () => void }) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("qr");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const go = async () => {
    if (!slot) return;
    setBusy(true);
    setErr(null);
    try {
      await startSession(router, { slot_id: slot.slot_id }, method);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <Dialog open={!!slot} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start attendance</DialogTitle>
          <DialogDescription>
            {slot?.course} · {slot?.batch} · {slot?.start_label}–{slot?.end_label}
            {slot?.room ? ` · ${slot.room}` : ""}
          </DialogDescription>
        </DialogHeader>
        <MethodPicker value={method} onChange={setMethod} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={go} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} Start Attendance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Batch -> Course -> Session picker + method choice. */
export function StartPanel({ options, slots }: { options: Options; slots: SlotItem[] }) {
  const router = useRouter();
  const [batch, setBatch] = useState<string>("");
  const [course, setCourse] = useState<string>("");
  const [slot, setSlot] = useState<string>("adhoc");
  const [method, setMethod] = useState<Method>("qr");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const batchOpts = options.batches;
  const courseOpts = options.classes.filter((c) => c.batch_id === batch);
  const slotOpts = slots.filter((s) => s.batch_id === batch && s.course_id === course);
  const label = (list: { id: string; l: string }[], v: string, ph: string) => list.find((x) => x.id === v)?.l ?? ph;

  const start = async () => {
    setBusy(true);
    setErr(null);
    try {
      await startSession(router, slot === "adhoc" ? { batch_id: batch, course_id: course } : { slot_id: slot }, method);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  const bl = batchOpts.map((b) => ({ id: b.id, l: b.name }));
  const cl = courseOpts.map((c) => ({ id: c.course_id, l: c.course }));
  const sl = [{ id: "adhoc", l: "Start now (no timetable slot)" }, ...slotOpts.map((s) => ({ id: s.slot_id, l: `${s.start_label}–${s.end_label}${s.room ? ` · ${s.room}` : ""}` }))];

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h2 className="font-heading text-base font-semibold">Start attendance</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Batch</Label>
          <Select value={batch} onValueChange={(v) => { setBatch(String(v)); setCourse(""); setSlot("adhoc"); }}>
            <SelectTrigger className="w-full"><SelectValue>{label(bl, batch, "Select batch")}</SelectValue></SelectTrigger>
            <SelectContent>{bl.map((b) => <SelectItem key={b.id} value={b.id}>{b.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Course</Label>
          <Select value={course} onValueChange={(v) => { setCourse(String(v)); setSlot("adhoc"); }} disabled={!batch}>
            <SelectTrigger className="w-full"><SelectValue>{label(cl, course, batch ? "Select course" : "Pick a batch first")}</SelectValue></SelectTrigger>
            <SelectContent>{cl.map((c) => <SelectItem key={c.id} value={c.id}>{c.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Today&apos;s session</Label>
          <Select value={slot} onValueChange={(v) => setSlot(String(v))} disabled={!course}>
            <SelectTrigger className="w-full"><SelectValue>{label(sl, slot, "Select session")}</SelectValue></SelectTrigger>
            <SelectContent>{sl.map((s) => <SelectItem key={s.id} value={s.id}>{s.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <MethodPicker value={method} onChange={setMethod} />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex justify-end">
        <Button onClick={start} disabled={!batch || !course || busy}>
          {busy && <Loader2 className="size-4 animate-spin" />} Start Attendance
        </Button>
      </div>
    </div>
  );
}
