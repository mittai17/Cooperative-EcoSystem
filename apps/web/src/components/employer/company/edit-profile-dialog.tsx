"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { updateCompany, type Api, type CompanyProfile } from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_DEPARTMENTS = 30;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

interface EditProfileDialogProps {
  api: Api;
  company: CompanyProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  sector: string;
  description: string;
  location: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  departments: string;
}

export function EditProfileDialog({ api, company, open, onOpenChange, onSaved }: EditProfileDialogProps) {
  const [form, setForm] = useState<FormState>({
    name: company.name,
    sector: company.sector ?? "",
    description: company.description ?? "",
    location: company.location ?? "",
    website: company.website ?? "",
    contactEmail: company.contact_email ?? "",
    contactPhone: company.contact_phone ?? "",
    departments: company.departments.join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Organisation name is required.";
    if (form.website.trim() && !isHttpUrl(form.website.trim())) return "Website must start with http:// or https://.";
    if (form.contactEmail.trim() && !EMAIL_RE.test(form.contactEmail.trim())) return "Enter a valid contact email.";
    const departments = parseDepartments(form.departments);
    if (departments.length > MAX_DEPARTMENTS) return `List at most ${MAX_DEPARTMENTS} departments.`;
    return null;
  }

  async function save() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateCompany(api, {
        name: form.name.trim(),
        sector: form.sector.trim() || null,
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        website: form.website.trim() || null,
        contact_email: form.contactEmail.trim() || null,
        contact_phone: form.contactPhone.trim() || null,
        departments: parseDepartments(form.departments),
      });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, "The profile could not be saved. Your changes are still here."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit company profile</DialogTitle>
          <DialogDescription>This information appears on your job postings and to candidates.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-name">Organisation name</Label>
            <Input id="company-name" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-sector">Sector</Label>
            <Input id="company-sector" placeholder="e.g. Dairy Cooperative" value={form.sector} onChange={(e) => update("sector", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-description">Description</Label>
            <Textarea id="company-description" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-location">Location</Label>
            <Input id="company-location" placeholder="e.g. Anand, Gujarat" value={form.location} onChange={(e) => update("location", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-website">Website</Label>
            <Input id="company-website" type="url" placeholder="https://" value={form.website} onChange={(e) => update("website", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-email">Contact email</Label>
            <Input id="company-email" type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-phone">Contact phone</Label>
            <Input id="company-phone" value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-departments">Departments</Label>
            <Input
              id="company-departments"
              placeholder="Separate with commas, e.g. Operations, Marketing, Accounts"
              value={form.departments}
              onChange={(e) => update("departments", e.target.value)}
            />
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Save profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function parseDepartments(value: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value.split(",")) {
    const item = raw.trim();
    if (!item || seen.has(item.toLowerCase())) continue;
    seen.add(item.toLowerCase());
    out.push(item);
  }
  return out;
}
