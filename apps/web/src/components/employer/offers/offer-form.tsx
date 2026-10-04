"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createOffer,
  EMPLOYMENT_TYPES,
  type ApplicationSummary,
  type Api,
  type EmploymentType,
  type OfferInput,
} from "@/lib/employer/workflow-api";
import { errorMessage, formatCurrency, formatDate } from "@/lib/employer/workflow-format";

const EMPLOYMENT_ITEMS = EMPLOYMENT_TYPES.map((t) => ({ label: t.label, value: t.value }));

interface OfferFormProps {
  api: Api;
  application: ApplicationSummary;
  onSaved: (message: string) => void;
}

interface FormState {
  salary: string;
  employmentType: EmploymentType;
  joiningDate: string;
  location: string;
  benefits: string;
  additionalTerms: string;
}

const EMPTY: FormState = {
  salary: "",
  employmentType: "full_time",
  joiningDate: "",
  location: "",
  benefits: "",
  additionalTerms: "",
};

export function OfferForm({ api, application, onSaved }: OfferFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState<"draft" | "sent" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const salaryValue = Number(form.salary);
  const employmentLabel = EMPLOYMENT_TYPES.find((t) => t.value === form.employmentType)?.label ?? "";

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function sendValidationError(): string | null {
    if (!form.salary || !Number.isFinite(salaryValue) || salaryValue <= 0) return "Enter a salary greater than zero before sending.";
    if (!form.joiningDate) return "Pick a joining date before sending.";
    if (!form.location.trim()) return "Enter the work location before sending.";
    return null;
  }

  async function submit(status: "draft" | "sent") {
    if (status === "sent") {
      const problem = sendValidationError();
      if (problem) {
        setError(problem);
        return;
      }
    }
    setSubmitting(status);
    setError(null);
    const body: OfferInput = {
      application_id: application.id,
      salary: form.salary && Number.isFinite(salaryValue) ? salaryValue : null,
      employment_type: form.employmentType,
      joining_date: form.joiningDate || null,
      location: form.location.trim() || null,
      benefits: form.benefits.trim() || null,
      additional_terms: form.additionalTerms.trim() || null,
      status,
    };
    try {
      await createOffer(api, body);
      onSaved(status === "sent" ? "Offer sent to the candidate." : "Draft saved. You can send it from the offers list.");
    } catch (err) {
      setError(errorMessage(err, "The offer could not be saved. Your entries are still here."));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 rounded-xl bg-muted/50 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Candidate</p>
          <p className="font-medium text-foreground">{application.candidate_name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Job</p>
          <p className="font-medium text-foreground">{application.job_title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="offer-salary">Salary (INR per year)</Label>
          <Input
            id="offer-salary"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="e.g. 240000"
            value={form.salary}
            onChange={(e) => update("salary", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Employment type</Label>
          <Select
            items={EMPLOYMENT_ITEMS}
            value={form.employmentType}
            onValueChange={(v) => v && update("employmentType", v as EmploymentType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-joining">Joining date</Label>
          <Input id="offer-joining" type="date" value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-location">Location</Label>
          <Input
            id="offer-location"
            placeholder="e.g. Anand, Gujarat"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="offer-benefits">Benefits</Label>
        <Textarea
          id="offer-benefits"
          rows={3}
          placeholder="e.g. Health insurance, transport allowance, training stipend"
          value={form.benefits}
          onChange={(e) => update("benefits", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="offer-terms">Additional terms</Label>
        <Textarea
          id="offer-terms"
          rows={3}
          placeholder="e.g. Probation period of three months"
          value={form.additionalTerms}
          onChange={(e) => update("additionalTerms", e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" render={<Link href="/employer/offers" />}>
          Cancel
        </Button>
        <Button variant="outline" onClick={() => submit("draft")} disabled={submitting !== null}>
          {submitting === "draft" && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          Save Draft
        </Button>
        <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={submitting !== null}>
          <Eye />
          Preview
        </Button>
        <Button onClick={() => submit("sent")} disabled={submitting !== null}>
          {submitting === "sent" && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          Send Offer
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offer preview</DialogTitle>
            <DialogDescription>This is how the offer summary reads. Nothing is sent from here.</DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Candidate</dt>
            <dd className="font-medium">{application.candidate_name}</dd>
            <dt className="text-muted-foreground">Job</dt>
            <dd className="font-medium">{application.job_title}</dd>
            <dt className="text-muted-foreground">Salary</dt>
            <dd className="font-medium">{form.salary ? formatCurrency(salaryValue) + " per year" : "Not set"}</dd>
            <dt className="text-muted-foreground">Employment</dt>
            <dd className="font-medium">{employmentLabel}</dd>
            <dt className="text-muted-foreground">Joining date</dt>
            <dd className="font-medium">{form.joiningDate ? formatDate(form.joiningDate) : "Not set"}</dd>
            <dt className="text-muted-foreground">Location</dt>
            <dd className="font-medium">{form.location.trim() || "Not set"}</dd>
            <dt className="text-muted-foreground">Benefits</dt>
            <dd className="whitespace-pre-line font-medium">{form.benefits.trim() || "None listed"}</dd>
            <dt className="text-muted-foreground">Additional terms</dt>
            <dd className="whitespace-pre-line font-medium">{form.additionalTerms.trim() || "None"}</dd>
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
