"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClassOption } from "@/components/trainer/assessments/types";
import { trainerPost } from "@/lib/trainer/api";

export function CreateAssignmentDialog({ open, onOpenChange, classes, onCreated }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  classes: ClassOption[];
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [classKey, setClassKey] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [resources, setResources] = useState<{ title: string; url: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(status: "draft" | "published") {
    setError(null);
    const [batchId, courseId] = classKey.split("|");
    if (!title.trim()) return setError("Enter a title");
    if (!batchId || !courseId) return setError("Choose a batch and course");
    const res = resources.filter((r) => r.title.trim() || r.url.trim());
    if (res.some((r) => !r.title.trim() || !/^https?:\/\//.test(r.url.trim()))) return setError("Each resource needs a title and an http(s) link");
    setSaving(true);
    try {
      await trainerPost("/assignments", {
        title: title.trim(), description: description.trim() || null, batch_id: batchId, course_id: courseId,
        deadline: deadline || null, max_marks: maxMarks, resources: res.map((r) => ({ title: r.title.trim(), url: r.url.trim() })), status,
      });
      setTitle(""); setDescription(""); setDeadline(""); setMaxMarks(100); setResources([]); setClassKey("");
      onOpenChange(false);
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create assignment</DialogTitle>
          <DialogDescription>Assign work to every trainee in a batch you teach.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="as-title">Title</Label>
            <Input id="as-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="as-class">Batch and course</Label>
            <select id="as-class" value={classKey} onChange={(e) => setClassKey(e.target.value)}
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <option value="">Select batch · course</option>
              {classes.map((c) => <option key={`${c.batch_id}|${c.course_id}`} value={`${c.batch_id}|${c.course_id}`}>{c.batch} · {c.course}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="as-desc">Description</Label>
            <Textarea id="as-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="as-dl">Deadline (IST)</Label>
              <Input id="as-dl" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="as-max">Maximum marks</Label>
              <Input id="as-max" type="number" min={1} max={1000} value={maxMarks} onChange={(e) => setMaxMarks(Math.max(1, Number(e.target.value) || 1))} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Resources (links)</Label>
            {resources.map((r, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Title" value={r.title} onChange={(e) => setResources((s) => s.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                <Input placeholder="https://…" value={r.url} onChange={(e) => setResources((s) => s.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                <Button type="button" size="icon" variant="ghost" aria-label="Remove resource" onClick={() => setResources((s) => s.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setResources((s) => [...s, { title: "", url: "" }])}>
              <Plus className="mr-1 size-4" />Add resource
            </Button>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => void submit("draft")}>Save Draft</Button>
          <Button disabled={saving} onClick={() => void submit("published")}>{saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
