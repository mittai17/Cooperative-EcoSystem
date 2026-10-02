"use client";

import { useState, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, CheckCircle2, Upload, Trash2, Eye, AlertCircle, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Programme } from "@/types/programme";
import type { Application, DocumentRecord } from "@/types/application";
import { useApplications, useApplicationDrafts, generateApplicationId } from "@/lib/store/programme-store";
import { checkEligibility, DEMO_TRAINEE_PROFILE } from "@/lib/services/eligibility-service";

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Profile", short: "Profile" },
  { id: 2, label: "Eligibility", short: "Eligibility" },
  { id: 3, label: "Preferences", short: "Preferences" },
  { id: 4, label: "Documents", short: "Documents" },
  { id: 5, label: "Review", short: "Review" },
  { id: 6, label: "Confirm", short: "Confirm" },
];

interface Props {
  programme: Programme;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplicationWizard({ programme, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId] = useState("");
  const { createApplication } = useApplications();
  const { saveDraft, getDraft, clearDraft } = useApplicationDrafts();

  const draft = getDraft(programme.id);

  const [personalInfo, setPersonalInfo] = useState({
    fullName: (draft?.personalInfo as any)?.fullName ?? "Ravindra Suresh Patil",
    dateOfBirth: (draft?.personalInfo as any)?.dateOfBirth ?? "1992-07-15",
    gender: (draft?.personalInfo as any)?.gender ?? "Male",
    phone: (draft?.personalInfo as any)?.phone ?? "+91 98765 43210",
    address: (draft?.personalInfo as any)?.address ?? "Plot 12, Govind Nagar, Nashik 422 001",
    state: (draft?.personalInfo as any)?.state ?? "Maharashtra",
    district: (draft?.personalInfo as any)?.district ?? "Nashik",
    occupation: (draft?.personalInfo as any)?.occupation ?? "PACS Secretary",
    cooperativeMembership: (draft?.personalInfo as any)?.cooperativeMembership ?? "Haveli Taluka PACS",
    education: (draft?.personalInfo as any)?.education ?? "Graduate",
    experience: (draft?.personalInfo as any)?.experience ?? "4 years",
  });

  const [preferences, setPreferences] = useState({
    preferredLanguage: draft?.preferences?.preferredLanguage ?? "Marathi",
    preferredBatch: draft?.preferences?.preferredBatch ?? "Batch A — Morning",
    modePreference: draft?.preferences?.modePreference ?? programme.mode,
    hostelRequired: draft?.preferences?.hostelRequired ?? false,
    mealRequired: draft?.preferences?.mealRequired ?? false,
    transportRequired: draft?.preferences?.transportRequired ?? false,
    specialNeeds: draft?.preferences?.specialNeeds ?? "",
  });

  const [documents, setDocuments] = useState<DocumentRecord[]>(
    draft?.documents ?? programme.documentsRequired.map((d, i) => ({
      type: ["aadhaar", "education", "membership", "photo", "employment", "medical", "experience"][i] ?? `doc-${i}`,
      label: d,
      required: true,
      status: "pending" as const,
    }))
  );

  const eligibility = checkEligibility(programme.eligibilityRules, DEMO_TRAINEE_PROFILE);

  const handleSaveDraft = useCallback(() => {
    setSaving(true);
    saveDraft(programme.id, { personalInfo: personalInfo as any, preferences, documents, draftStep: step });
    setTimeout(() => setSaving(false), 800);
  }, [programme.id, personalInfo, preferences, documents, step, saveDraft]);

  const handleUpload = useCallback((index: number, fileName: string) => {
    setDocuments((prev) =>
      prev.map((d, i) =>
        i === index
          ? { ...d, fileName, fileSize: Math.floor(50000 + Math.random() * 400000), uploadedAt: new Date().toISOString(), status: "uploaded" }
          : d
      )
    );
  }, []);

  const handleRemove = useCallback((index: number) => {
    setDocuments((prev) =>
      prev.map((d, i) => i === index ? { ...d, fileName: undefined, fileSize: undefined, uploadedAt: undefined, status: "pending" } : d)
    );
  }, []);

  const handleSubmit = useCallback(() => {
    const id = generateApplicationId();
    setAppId(id);
    const app: Application = {
      id,
      programmeId: programme.id,
      programmeTitle: programme.title,
      programmeType: programme.type,
      institutionId: programme.institutionId,
      institutionName: programme.institution,
      traineeId: "trainee-ravindra",
      traineeName: personalInfo.fullName,
      traineeEmail: "ravindra.patil@coopsetu.ai",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "pending_trainer",
      currentStage: "Pending Trainer Review",
      eligibilityResult: eligibility.overall,
      eligibilityDetails: eligibility.details.map((d) => ({ label: d.label, met: d.met, reason: d.reason })),
      preferences,
      documents,
      timeline: [
        { id: "tl-1", timestamp: new Date().toISOString(), actor: personalInfo.fullName, actorRole: "trainee", action: "Submitted application", status: "submitted" },
        { id: "tl-2", timestamp: new Date(Date.now() + 60000).toISOString(), actor: "System", actorRole: "system", action: "Eligibility check completed — " + (eligibility.overall === "eligible" ? "Eligible" : "Flagged"), status: "pending_trainer" },
      ],
      personalInfo: personalInfo as any,
    };
    createApplication(app);
    clearDraft(programme.id);
    setSubmitted(true);
    setStep(6);
  }, [programme, personalInfo, preferences, documents, eligibility, createApplication, clearDraft]);

  const canProceed = useCallback(() => {
    if (step === 4) {
      const requiredDocs = documents.filter((d) => d.required);
      return requiredDocs.every((d) => d.status === "uploaded" || d.status === "verified");
    }
    return true;
  }, [step, documents]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={submitted ? onClose : undefined} />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex flex-col rounded-2xl bg-background shadow-2xl overflow-hidden sm:inset-8 md:inset-[5%]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">Programme Application</h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{programme.title} — {programme.institution}</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Progress indicator */}
        {!submitted && (
          <div className="px-6 py-3 border-b border-border bg-muted/20">
            <div className="flex items-center gap-1 overflow-x-auto">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => s.id < step && setStep(s.id)}
                    disabled={s.id > step}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      step === s.id ? "bg-primary text-primary-foreground" :
                      s.id < step ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20" :
                      "text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {s.id < step ? <CheckCircle2 className="size-3" /> : <span className="size-4 text-center">{s.id}</span>}
                    <span className="hidden sm:inline">{s.short}</span>
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="size-3 text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Step 1: Profile */}
          {step === 1 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div>
                <h3 className="font-heading text-base font-bold">Personal Details</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Verify your personal information for this application.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { key: "fullName", label: "Full Name" },
                  { key: "dateOfBirth", label: "Date of Birth", type: "date" },
                  { key: "phone", label: "Phone Number" },
                  { key: "occupation", label: "Occupation" },
                ].map((f) => (
                  <div key={f.key}>
                    <Label className="text-xs mb-1.5 block">{f.label} *</Label>
                    <Input
                      type={f.type ?? "text"}
                      value={(personalInfo as any)[f.key]}
                      onChange={(e) => setPersonalInfo((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
                <div>
                  <Label className="text-xs mb-1.5 block">Gender *</Label>
                  <RadioGroup value={personalInfo.gender} onValueChange={(v) => setPersonalInfo((prev) => ({ ...prev, gender: v }))}>
                    <div className="flex gap-4">
                      {["Male", "Female", "Other"].map((g) => (
                        <div key={g} className="flex items-center gap-1.5">
                          <RadioGroupItem value={g} id={`gender-${g}`} />
                          <Label htmlFor={`gender-${g}`} className="text-xs cursor-pointer">{g}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Education *</Label>
                  <RadioGroup value={personalInfo.education} onValueChange={(v) => setPersonalInfo((prev) => ({ ...prev, education: v }))}>
                    <div className="flex flex-wrap gap-3">
                      {["10th Pass", "12th Pass", "Graduate", "Post-Graduate"].map((e) => (
                        <div key={e} className="flex items-center gap-1.5">
                          <RadioGroupItem value={e} id={`edu-${e}`} />
                          <Label htmlFor={`edu-${e}`} className="text-xs cursor-pointer">{e}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs mb-1.5 block">Address *</Label>
                  <Textarea
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo((prev) => ({ ...prev, address: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">State *</Label>
                  <Input value={personalInfo.state} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, state: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">District *</Label>
                  <Input value={personalInfo.district} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, district: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Cooperative Membership *</Label>
                  <Input value={personalInfo.cooperativeMembership} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, cooperativeMembership: e.target.value }))} placeholder="Name of your cooperative society" />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Years of Experience</Label>
                  <Input value={personalInfo.experience} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, experience: e.target.value }))} placeholder="e.g. 4 years" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Eligibility */}
          {step === 2 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div>
                <h3 className="font-heading text-base font-bold">Eligibility Check</h3>
                <p className="text-sm text-muted-foreground mt-0.5">We have verified your eligibility based on your profile.</p>
              </div>
              <div className={cn(
                "flex items-start gap-3 rounded-xl border p-4",
                eligibility.overall === "eligible" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              )}>
                {eligibility.overall === "eligible" ? (
                  <CheckCircle2 className="size-6 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-6 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={cn("font-bold text-sm", eligibility.overall === "eligible" ? "text-green-700" : "text-red-700")}>
                    {eligibility.overall === "eligible" ? "You are eligible to apply!" : "Eligibility check failed"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{eligibility.summary}</p>
                </div>
              </div>
              <div className="space-y-2">
                {eligibility.details.map((d) => (
                  <div key={d.ruleId} className={cn(
                    "flex items-start gap-3 rounded-lg border p-3",
                    d.met ? "bg-green-50/60 border-green-100" : "bg-red-50/60 border-red-100"
                  )}>
                    {d.met ? <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" /> : <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium">{d.label}</p>
                      <p className="text-xs text-muted-foreground">{d.description}</p>
                      {!d.met && d.reason && <p className="text-xs text-red-600 mt-0.5">{d.reason}</p>}
                    </div>
                    {d.met ? (
                      <Badge className="ml-auto shrink-0 bg-green-100 text-green-700 text-xs">Met</Badge>
                    ) : (
                      <Badge className="ml-auto shrink-0 bg-red-100 text-red-700 text-xs">Not Met</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div>
                <h3 className="font-heading text-base font-bold">Programme Preferences</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Specify your preferences for this programme.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs mb-1.5 block">Preferred Language *</Label>
                  <RadioGroup value={preferences.preferredLanguage} onValueChange={(v) => setPreferences((prev) => ({ ...prev, preferredLanguage: v }))}>
                    <div className="flex flex-wrap gap-3">
                      {programme.language.map((l) => (
                        <div key={l} className="flex items-center gap-1.5">
                          <RadioGroupItem value={l} id={`lang-${l}`} />
                          <Label htmlFor={`lang-${l}`} className="text-xs cursor-pointer">{l}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Preferred Batch *</Label>
                  <RadioGroup value={preferences.preferredBatch} onValueChange={(v) => setPreferences((prev) => ({ ...prev, preferredBatch: v }))}>
                    <div className="flex flex-col gap-2">
                      {["Batch A — Morning (9 AM – 1 PM)", "Batch B — Afternoon (2 PM – 6 PM)", "Batch C — Evening (6 PM – 9 PM)"].map((b) => (
                        <div key={b} className="flex items-center gap-1.5">
                          <RadioGroupItem value={b} id={`batch-${b}`} />
                          <Label htmlFor={`batch-${b}`} className="text-xs cursor-pointer">{b}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </div>
              {programme.hostelAvailable && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Facilities Required</p>
                  {[
                    { key: "hostelRequired", label: "Hostel Accommodation", enabled: programme.hostelAvailable },
                    { key: "mealRequired", label: "Meal Facility", enabled: programme.mealAvailable },
                    { key: "transportRequired", label: "Transport Facility", enabled: programme.transportAvailable },
                  ].filter((f) => f.enabled).map((f) => (
                    <div key={f.key} className="flex items-center gap-2.5">
                      <Checkbox
                        id={f.key}
                        checked={(preferences as any)[f.key]}
                        onCheckedChange={(v) => setPreferences((prev) => ({ ...prev, [f.key]: Boolean(v) }))}
                      />
                      <Label htmlFor={f.key} className="text-sm cursor-pointer">{f.label}</Label>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Label className="text-xs mb-1.5 block">Special Needs / Accessibility Requirements</Label>
                <Textarea
                  value={preferences.specialNeeds}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, specialNeeds: e.target.value }))}
                  placeholder="Any specific accessibility requirements or special needs (optional)"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div>
                <h3 className="font-heading text-base font-bold">Document Upload</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Upload all required documents. Accepted formats: PDF, JPG, PNG (max 5 MB).</p>
              </div>
              <div className="space-y-3">
                {documents.map((doc, i) => (
                  <div
                    key={doc.type}
                    className={cn(
                      "rounded-xl border p-4",
                      doc.status === "uploaded" || doc.status === "verified"
                        ? "border-green-200 bg-green-50/50"
                        : doc.status === "invalid"
                        ? "border-red-200 bg-red-50/50"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium">{doc.label}</p>
                          {doc.required && <span className="text-red-500 text-xs">*</span>}
                        </div>
                        {doc.fileName && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {doc.fileName} {doc.fileSize && `(${(doc.fileSize / 1024).toFixed(0)} KB)`}
                          </p>
                        )}
                        {doc.notes && (
                          <p className="text-xs text-red-600 mt-0.5">{doc.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(doc.status === "uploaded" || doc.status === "verified") && (
                          <>
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <CheckCircle2 className="size-2.5 mr-0.5" />
                              {doc.status === "verified" ? "Verified" : "Uploaded"}
                            </Badge>
                            <button
                              onClick={() => handleRemove(i)}
                              className="size-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                        {doc.status === "invalid" && (
                          <Badge className="bg-red-100 text-red-700 text-xs">Invalid</Badge>
                        )}
                        {doc.status === "pending" && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Pending</Badge>
                        )}
                      </div>
                    </div>

                    {(doc.status === "pending" || doc.status === "invalid") && (
                      <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                        <Upload className="size-4 shrink-0" />
                        <span>Click to upload {doc.label}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(i, file.name);
                          }}
                        />
                      </label>
                    )}

                    {(doc.status === "uploaded" || doc.status === "verified") && (
                      <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <Upload className="size-3" />
                        <span>Replace file</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(i, file.name);
                          }}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div>
                <h3 className="font-heading text-base font-bold">Review Your Application</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Please review all details before submitting.</p>
              </div>

              {/* Summary sections */}
              {[
                {
                  title: "Programme", step: 1, items: [
                    ["Programme", programme.title],
                    ["Institution", programme.institution],
                    ["Mode", programme.mode],
                    ["Start Date", new Date(programme.startDate).toLocaleDateString("en-IN")],
                    ["Fee", programme.isFree ? "Free" : `₹${programme.fee.toLocaleString("en-IN")}`],
                  ]
                },
                {
                  title: "Personal Details", step: 1, items: [
                    ["Name", personalInfo.fullName],
                    ["Date of Birth", personalInfo.dateOfBirth],
                    ["Gender", personalInfo.gender],
                    ["Phone", personalInfo.phone],
                    ["State", personalInfo.state],
                    ["Cooperative", personalInfo.cooperativeMembership],
                    ["Education", personalInfo.education],
                    ["Experience", personalInfo.experience],
                  ]
                },
                {
                  title: "Preferences", step: 3, items: [
                    ["Language", preferences.preferredLanguage],
                    ["Batch", preferences.preferredBatch],
                    ["Mode", preferences.modePreference],
                    ["Hostel", preferences.hostelRequired ? "Required" : "Not required"],
                    ["Meals", preferences.mealRequired ? "Required" : "Not required"],
                  ]
                },
                {
                  title: "Documents", step: 4, items: documents.map((d) => [d.label, d.status === "uploaded" || d.status === "verified" ? "✓ Uploaded" : "⚠ Pending"])
                },
              ].map((section) => (
                <div key={section.title} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
                    <p className="text-sm font-semibold">{section.title}</p>
                    <button
                      onClick={() => setStep(section.step)}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {section.items.map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={cn("text-sm font-medium", String(value).includes("Pending") && "text-amber-600")}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                <p className="font-medium mb-0.5">Before you submit</p>
                <p>By submitting this application, you confirm that all information provided is accurate. False information may result in disqualification.</p>
              </div>
            </div>
          )}

          {/* Step 6: Success */}
          {step === 6 && submitted && (
            <div className="flex flex-col items-center justify-center py-10 text-center max-w-sm mx-auto space-y-5">
              <div className="size-20 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="size-10 text-green-500" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">Application Submitted!</h3>
                <p className="text-muted-foreground mt-2 text-sm">Your application has been successfully submitted and is now pending trainer review.</p>
              </div>
              <div className="w-full rounded-xl border border-border bg-muted/30 p-4 text-left space-y-2">
                {[
                  ["Application ID", appId],
                  ["Programme", programme.title],
                  ["Institution", programme.institution],
                  ["Submitted", new Date().toLocaleDateString("en-IN")],
                  ["Next Step", "Pending Trainer Review"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
              </div>
              <Button onClick={onSuccess} className="w-full">
                Track Application <ChevronRight className="size-4 ml-1" />
              </Button>
              <button onClick={onClose} className="text-xs text-muted-foreground hover:underline">Close</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                  <ChevronLeft className="size-4 mr-1" /> Back
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveDraft}
                className="text-muted-foreground"
              >
                {saving ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <Save className="size-3.5 mr-1" />}
                Save Draft
              </Button>
            </div>

            <div className="text-xs text-muted-foreground hidden sm:block">
              Step {step} of {STEPS.length - 1}
            </div>

            {step < 5 && (
              <Button onClick={() => setStep((s) => s + 1)}>
                Continue <ChevronRight className="size-4 ml-1" />
              </Button>
            )}
            {step === 5 && (
              <Button
                onClick={handleSubmit}
                disabled={eligibility.overall === "not_eligible"}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Submit Application <CheckCircle2 className="size-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
