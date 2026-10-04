"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, GraduationCap, Sparkles, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreateProgrammePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [sector, setSector] = useState("Dairy");
  const [level, setLevel] = useState("Foundation");
  const [mode, setMode] = useState("Blended");
  const [durationWeeks, setDurationWeeks] = useState("6");
  const [seatsTotal, setSeatsTotal] = useState("30");
  const [startDate, setStartDate] = useState("2026-10-15");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a programme title.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const newProg = {
        id: `prog-${Date.now()}`,
        title: title.trim(),
        sector,
        level,
        mode,
        durationWeeks: parseInt(durationWeeks, 10) || 6,
        seatsTotal: parseInt(seatsTotal, 10) || 30,
        seatsFilled: 0,
        trainees: 0,
        attendance: 100,
        status: "Active",
        startDate,
        description: description.trim() || "Accredited cooperative skill-building course under NCCT guidelines.",
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [sector, "Cooperative Governance"],
      };

      try {
        const stored = localStorage.getItem("coopsetu_institution_programmes");
        const list = stored ? JSON.parse(stored) : [];
        localStorage.setItem("coopsetu_institution_programmes", JSON.stringify([newProg, ...list]));
      } catch {}

      router.push("/institution/programmes?created=true");
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/institution/programmes"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="size-4" /> Back to Programmes
        </Link>
        <PageHeader
          title="Create Training Programme"
          description="Design and publish a new accredited multi-week cooperative curriculum."
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="size-4" />
              </span>
              <CardTitle className="font-heading text-lg">Programme Details</CardTitle>
            </div>
            <CardDescription className="text-xs">
              All details will be indexed on the public programmes catalogue and in your institution dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Programme Title *
              </label>
              <Input
                placeholder="e.g. Dairy Cold Chain Operations & Milk Testing Standards"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Cooperative Sector
                </label>
                <Select value={sector} onValueChange={(v) => v && setSector(v)}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dairy">Dairy Cooperatives</SelectItem>
                    <SelectItem value="Credit & Banking">Credit &amp; PACS</SelectItem>
                    <SelectItem value="Agriculture">Agriculture &amp; Farmer Producer</SelectItem>
                    <SelectItem value="Handloom & Textiles">Handloom &amp; Textiles</SelectItem>
                    <SelectItem value="Fisheries">Fisheries Cooperatives</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Difficulty Level
                </label>
                <Select value={level} onValueChange={(v) => v && setLevel(v)}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Foundation">Foundation (Entry)</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced (Executive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Instruction Mode
                </label>
                <Select value={mode} onValueChange={(v) => v && setMode(v)}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-person">In-person Campus</SelectItem>
                    <SelectItem value="Online">Online Virtual</SelectItem>
                    <SelectItem value="Blended">Blended (Hybrid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Duration (Weeks)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="52"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Total Seat Capacity
                </label>
                <Input
                  type="number"
                  min="5"
                  max="200"
                  value={seatsTotal}
                  onChange={(e) => setSeatsTotal(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Curriculum Tags / Verified Skills (comma separated)
              </label>
              <Input
                placeholder="e.g. Milk Chilling, Quality Sampling, HACCP, PACS Accounting"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Programme Description
              </label>
              <Textarea
                placeholder="Outline the core objective, targeted trainee backgrounds, and practical field modules..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                render={<Link href="/institution/programmes" />}
              >Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Publishing..." : "Create & Publish Programme"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
