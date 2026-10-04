"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search, BookOpen, Award, GraduationCap,
  Monitor, Clock, MapPin, Users, Star, Heart,
  CheckCircle2, ArrowRight,
  Building2, Calendar, FileText, TrendingUp, X, SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MOCK_PROGRAMMES } from "@/lib/mock-data/programmes-data";
import type { Programme, ProgrammeLang, ProgrammeType } from "@/types/programme";
import { useApplications, useSavedProgrammes } from "@/lib/store/programme-store";
import { DEMO_TRAINEE_PROFILE, getRecommendationReason } from "@/lib/services/eligibility-service";
import { ProgrammeDetailDrawer } from "./components/programme-detail-drawer";
import { ApplicationWizard } from "./components/application-wizard";
import { MyApplicationsPanel } from "./components/my-applications-panel";
import { KPICards } from "./components/kpi-cards";
import { AIRecommendationCard } from "./components/ai-recommendation-card";
import { UpcomingSchedulePanel } from "./components/upcoming-schedule-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { useT } from "@/i18n";
import { optionLabel } from "./option-labels";

// ─── Types & Constants ────────────────────────────────────────────────────────
const CATEGORY_TABS: { value: ProgrammeType | "all"; labelKey: string; icon: React.ElementType }[] = [
  { value: "all", labelKey: "trainee.programmes.catAll", icon: BookOpen },
  { value: "training", labelKey: "trainee.programmes.catTraining", icon: GraduationCap },
  { value: "short-course", labelKey: "trainee.programmes.catShort", icon: Clock },
  { value: "certification-exam", labelKey: "trainee.programmes.catExams", icon: Award },
  { value: "skill-development", labelKey: "trainee.programmes.catSkill", icon: TrendingUp },
  { value: "digital-literacy", labelKey: "trainee.programmes.catDigital", icon: Monitor },
];

const INSTITUTIONS = ["All", "VAMNICOM", "RICM Pune", "RICM Lucknow", "ICM Bhopal", "ICM Guwahati", "ICM Hyderabad", "ICM Anand", "NDRI"];
const MODES = ["All", "Online", "On-Campus", "Hybrid", "Offline Residential"];
const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];
const LANGUAGES = ["All", "English", "Hindi", "Marathi", "Tamil", "Telugu", "Gujarati", "Assamese"];
const SORT_OPTIONS = ["Recommended", "Newest", "Start Date", "Seats Available", "Popular", "Alphabetical"];

const STATUS_LABELS: Record<string, { labelKey: string; className: string }> = {
  draft: { labelKey: "trainee.programmes.status.draft", className: "bg-muted text-muted-foreground" },
  submitted: { labelKey: "trainee.programmes.status.submitted", className: "bg-blue-50 text-blue-700 border-blue-200" },
  pending_trainer: { labelKey: "trainee.programmes.status.pendingTrainer", className: "bg-amber-50 text-amber-700 border-amber-200" },
  correction_required: { labelKey: "trainee.programmes.status.correctionRequired", className: "bg-orange-50 text-orange-700 border-orange-200" },
  resubmitted: { labelKey: "trainee.programmes.status.resubmitted", className: "bg-blue-50 text-blue-700 border-blue-200" },
  trainer_approved: { labelKey: "trainee.programmes.status.trainerApproved", className: "bg-teal-50 text-teal-700 border-teal-200" },
  institution_approved: { labelKey: "trainee.programmes.status.institutionApproved", className: "bg-green-50 text-green-700 border-green-200" },
  batch_allocated: { labelKey: "trainee.programmes.status.batchAllocated", className: "bg-green-50 text-green-700 border-green-200" },
  waitlisted: { labelKey: "trainee.programmes.status.waitlisted", className: "bg-violet-50 text-violet-700 border-violet-200" },
  rejected: { labelKey: "trainee.programmes.status.rejected", className: "bg-red-50 text-red-700 border-red-200" },
  withdrawn: { labelKey: "trainee.programmes.status.withdrawn", className: "bg-muted text-muted-foreground" },
  completed: { labelKey: "trainee.programmes.status.completed", className: "bg-green-50 text-green-700 border-green-200" },
};

function getApplicationStatus(applications: ReturnType<ReturnType<typeof useApplications>["getByTrainee"]>, programmeId: string) {
  return applications.find((a) => a.programmeId === programmeId && a.status !== "withdrawn");
}

// ─── Programme Card ───────────────────────────────────────────────────────────
function ProgrammeCard({
  programme,
  onViewDetails,
  onApply,
}: {
  programme: Programme;
  onViewDetails: (p: Programme) => void;
  onApply: (p: Programme) => void;
}) {
  const t = useT();
  const { isSaved, toggle } = useSavedProgrammes();
  const { getByTrainee } = useApplications();
  const myApps = getByTrainee("trainee-ravindra");
  const existing = getApplicationStatus(myApps, programme.id);
  const saved = isSaved(programme.id);
  const isFull = programme.availableSeats === 0;
  const isLimited = programme.availableSeats > 0 && programme.availableSeats <= 5;
  const reason = getRecommendationReason(programme.id, DEMO_TRAINEE_PROFILE);

  const PROGRAMME_GRADIENTS: Record<string, string> = {
    training:             "from-orange-400 to-rose-500",
    "short-course":       "from-violet-500 to-blue-500",
    "certification-exam": "from-emerald-400 to-teal-600",
    "skill-development":  "from-amber-400 to-orange-500",
    "digital-literacy":   "from-sky-400 to-blue-600",
  };
  const gradient = PROGRAMME_GRADIENTS[programme.type] ?? "from-primary/80 to-primary";

  return (
    <Card className="group flex flex-col overflow-hidden border border-border/60 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 py-0">
      {/* Banner */}
      <div className={`relative h-36 w-full overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-7xl font-black text-white/20 select-none font-heading">{programme.title.charAt(0)}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Badges overlay */}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
          <Badge className="bg-card/95 text-foreground text-xs font-medium shadow-sm">
            {optionLabel(t, programme.level)}
          </Badge>
          {programme.isFree && (
            <Badge className="bg-green-500 text-white text-xs font-medium">{t("trainee.programmes.freeBadge")}</Badge>
          )}
          {reason && (
            <Badge className="bg-primary/90 text-primary-foreground text-xs font-medium">
              <Sparkles className="size-2.5 mr-0.5" />
              {t("trainee.programmes.recommendedBadge")}
            </Badge>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle(programme.id); }}
          className={cn(
            "absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-card/90 shadow-sm transition-colors",
            saved ? "text-primary" : "text-muted-foreground hover:text-primary"
          )}
          aria-label={saved ? t("trainee.programmes.unsave") : t("trainee.programmes.save")}
        >
          <Heart className={cn("size-3.5", saved && "fill-primary")} />
        </button>

        {/* Mode chip */}
        <div className="absolute bottom-2 left-2.5">
          <span className="text-[10px] font-semibold text-white/90 bg-black/40 rounded px-1.5 py-0.5">
            {optionLabel(t, programme.mode)}
          </span>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Title & Institution */}
        <div>
          <h3 className="font-heading text-sm font-bold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {programme.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{programme.institution}</p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {programme.duration} {programme.durationUnit}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {new Date(programme.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {programme.district}
          </span>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1">
          {programme.skills.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px] font-normal py-0.5">
              {s}
            </Badge>
          ))}
          {programme.skills.length > 3 && (
            <span className="text-[10px] text-muted-foreground self-center">+{t("trainee.programmes.moreSkills").replace("{count}", String(programme.skills.length - 3))}</span>
          )}
        </div>

        {/* Seats */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="size-3" />
            {isFull ? (
              <span className="text-destructive font-medium">{t("trainee.programmes.full")}</span>
            ) : isLimited ? (
              <span className="text-orange-600 font-medium">{t("trainee.programmes.seatsLeft").replace("{count}", String(programme.availableSeats))}</span>
            ) : (
              <span>{t("trainee.programmes.seatsLeft").replace("{count}", String(programme.availableSeats))}</span>
            )}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {programme.rating}
          </span>
        </div>

        {/* Fee */}
        <div className="text-xs text-muted-foreground">
          {programme.isFree ? (
            <span className="font-semibold text-green-600">{t("trainee.programmes.freeProgramme")}</span>
          ) : (
            <span>₹{programme.fee.toLocaleString("en-IN")} {t("trainee.programmes.registrationFee")}</span>
          )}
        </div>

        {/* CTAs */}
        <div className="mt-auto flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onViewDetails(programme)}
          >
            {t("trainee.programmes.viewDetails")}
          </Button>
          {existing ? (
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onViewDetails(programme)}
            >
              <CheckCircle2 className="size-3 mr-1" />
              {t(STATUS_LABELS[existing.status]?.labelKey ?? "trainee.programmes.status.applied")}
            </Button>
          ) : isFull ? (
            <Button size="sm" className="flex-1 h-8 text-xs" disabled>
              {t("trainee.programmes.registrationClosed")}
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onApply(programme)}
            >
              {t("trainee.programmes.applyNow")} <ArrowRight className="ml-1 size-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
interface Filters {
  institution: string;
  mode: string;
  level: string;
  language: string;
  sort: string;
  statusFilter: string;
}

function FilterBar({
  filters,
  onChange,
  onClear,
  query,
  setQuery,
}: {
  filters: Filters;
  onChange: (key: keyof Filters, val: string) => void;
  onClear: () => void;
  query: string;
  setQuery: (q: string) => void;
}) {
  const t = useT();
  const hasFilters = Object.values(filters).some((v) => v !== "All" && v !== "Recommended") || query.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("trainee.programmes.searchPlaceholder")}
          className="h-10 rounded-xl pl-10 pr-10"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select value={filters.institution} onValueChange={(v) => v && onChange("institution", v)}>
          <SelectTrigger size="sm" className="w-40">
            <Building2 className="size-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder={t("trainee.programmes.institutionPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {INSTITUTIONS.map((i) => <SelectItem key={i} value={i}>{optionLabel(t, i)}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.mode} onValueChange={(v) => v && onChange("mode", v)}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder={t("trainee.programmes.modePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {MODES.map((m) => <SelectItem key={m} value={m}>{optionLabel(t, m)}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.level} onValueChange={(v) => v && onChange("level", v)}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder={t("trainee.programmes.levelPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map((l) => <SelectItem key={l} value={l}>{optionLabel(t, l)}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.language} onValueChange={(v) => v && onChange("language", v)}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder={t("trainee.programmes.languagePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{optionLabel(t, l)}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Select value={filters.sort} onValueChange={(v) => v && onChange("sort", v)}>
            <SelectTrigger size="sm" className="w-40">
              <SlidersHorizontal className="size-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder={t("trainee.programmes.sortPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => <SelectItem key={s} value={s}>{optionLabel(t, s)}</SelectItem>)}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground hover:text-foreground h-8 px-2">
              <X className="size-3.5 mr-1" /> {t("trainee.programmes.clear")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProgrammesPage() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<ProgrammeType | "all">("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    institution: "All",
    mode: "All",
    level: "All",
    language: "All",
    sort: "Recommended",
    statusFilter: "All",
  });
  const [detailProgramme, setDetailProgramme] = useState<Programme | null>(null);
  const [wizardProgramme, setWizardProgramme] = useState<Programme | null>(null);
  const [activeSection, setActiveSection] = useState<"programmes" | "applications" | "nominations" | "exams">("programmes");

  const { getByTrainee } = useApplications();
  const myApps = getByTrainee("trainee-ravindra");

  const handleFilterChange = useCallback((key: keyof Filters, val: string) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setQuery("");
    setFilters({ institution: "All", mode: "All", level: "All", language: "All", sort: "Recommended", statusFilter: "All" });
  }, []);

  // KPI click handlers
  const handleKpiClick = useCallback((section: typeof activeSection) => {
    setActiveSection(section);
  }, []);

  const filtered = useMemo(() => {
    let result = MOCK_PROGRAMMES.filter((p) => {
      if (activeTab !== "all" && p.type !== activeTab) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !p.title.toLowerCase().includes(q) &&
          !p.institution.toLowerCase().includes(q) &&
          !p.tags.some((t) => t.toLowerCase().includes(q)) &&
          !p.skills.some((s) => s.toLowerCase().includes(q)) &&
          !p.location.toLowerCase().includes(q)
        )
          return false;
      }
      if (filters.institution !== "All" && !p.institution.includes(filters.institution)) return false;
      if (filters.mode !== "All" && p.mode !== filters.mode) return false;
      if (filters.level !== "All" && p.level !== filters.level) return false;
      if (filters.language !== "All" && !p.language.includes(filters.language as ProgrammeLang)) return false;
      return true;
    });

    // Sort
    switch (filters.sort) {
      case "Recommended":
        result = [...result].sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
        break;
      case "Alphabetical":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "Start Date":
        result = [...result].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        break;
      case "Seats Available":
        result = [...result].sort((a, b) => b.availableSeats - a.availableSeats);
        break;
      case "Popular":
        result = [...result].sort((a, b) => b.applicationCount - a.applicationCount);
        break;
    }

    return result;
  }, [activeTab, query, filters]);

  const recommended = useMemo(
    () => MOCK_PROGRAMMES.filter((p) => p.recommended || getRecommendationReason(p.id, DEMO_TRAINEE_PROFILE)),
    []
  );

  const pending = myApps.filter((a) => a.status === "pending_trainer").length;
  const approved = myApps.filter((a) => ["trainer_approved", "institution_approved", "batch_allocated", "completed"].includes(a.status)).length;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={t("trainee.programmes.title")}
        description={t("trainee.programmes.description")}
      />

      {/* KPI Cards */}
      <KPICards
        available={MOCK_PROGRAMMES.filter((p) => p.status === "active").length}
        myApplications={myApps.length}
        pendingApproval={pending}
        approved={approved}
        upcomingExams={2}
        onSectionChange={handleKpiClick}
        activeSection={activeSection}
      />

      {/* Section Tabs */}
      <div className="flex gap-1 flex-wrap">
        {(["programmes", "applications", "nominations", "exams"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
              activeSection === s
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {s === "programmes" ? t("trainee.programmes.sectionBrowse") : s === "applications" ? t("trainee.programmes.sectionApplications") : s === "nominations" ? t("trainee.programmes.sectionNominations") : t("trainee.programmes.sectionExams")}
          </button>
        ))}
      </div>

      {/* === Browse Programmes === */}
      {activeSection === "programmes" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <div className="xl:col-span-3 space-y-5">
            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
              query={query}
              setQuery={setQuery}
            />

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
                      activeTab === tab.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </div>

            {/* Recommended Section */}
            {activeTab === "all" && query === "" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    {t("trainee.programmes.recommendedTitle")}
                  </h2>
                  <span className="text-xs text-muted-foreground">{t("trainee.programmes.recommendedHint")}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recommended.slice(0, 3).map((p) => (
                    <ProgrammeCard
                      key={p.id}
                      programme={p}
                      onViewDetails={setDetailProgramme}
                      onApply={setWizardProgramme}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Programmes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-bold text-foreground">
                  {activeTab === "all" && query === "" ? t("trainee.programmes.allProgrammes") : t("trainee.programmes.results")}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {t(filtered.length === 1 ? "trainee.programmes.foundOne" : "trainee.programmes.foundMany").replace("{count}", String(filtered.length))}
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Search className="size-10 text-muted-foreground/40" />
                  <p className="font-medium text-foreground">{t("trainee.programmes.noMatch")}</p>
                  <p className="text-sm text-muted-foreground">{t("trainee.programmes.noMatchHint")}</p>
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>{t("trainee.programmes.clearFilters")}</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((p) => (
                    <ProgrammeCard
                      key={p.id}
                      programme={p}
                      onViewDetails={setDetailProgramme}
                      onApply={setWizardProgramme}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            <AIRecommendationCard onExplore={setWizardProgramme} />
            <UpcomingSchedulePanel />
          </div>
        </div>
      )}

      {/* === My Applications === */}
      {activeSection === "applications" && <MyApplicationsPanel traineeId="trainee-ravindra" />}

      {/* === Nominations === */}
      {activeSection === "nominations" && <NominationsSection />}

      {/* === Certification Exams === */}
      {activeSection === "exams" && <ExamsSection />}

      {/* Drawers & Modals */}
      {detailProgramme && (
        <ProgrammeDetailDrawer
          programme={detailProgramme}
          onClose={() => setDetailProgramme(null)}
          onApply={(p) => { setDetailProgramme(null); setWizardProgramme(p); }}
        />
      )}

      {wizardProgramme && (
        <ApplicationWizard
          programme={wizardProgramme}
          onClose={() => setWizardProgramme(null)}
          onSuccess={() => { setWizardProgramme(null); setActiveSection("applications"); }}
        />
      )}
    </div>
  );
}

// ─── Nominations Section ──────────────────────────────────────────────────────
function NominationsSection() {
  const t = useT();
  const { nominations } = useNominations();
  const myNoms = nominations.filter((n) => n.traineeId === "trainee-ravindra");

  const STATUS_COLOURS: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    submitted: "bg-blue-50 text-blue-700",
    cooperative_review: "bg-violet-50 text-violet-700",
    trainer_review: "bg-amber-50 text-amber-700",
    correction_required: "bg-orange-50 text-orange-700",
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    institution_confirmation: "bg-teal-50 text-teal-700",
    batch_allocated: "bg-green-50 text-green-700",
  };

  const STATUS_LABELS_NOM: Record<string, string> = {
    draft: "trainee.programmes.nomStatus.draft",
    submitted: "trainee.programmes.nomStatus.submitted",
    cooperative_review: "trainee.programmes.nomStatus.cooperative_review",
    trainer_review: "trainee.programmes.nomStatus.trainer_review",
    correction_required: "trainee.programmes.nomStatus.correction_required",
    approved: "trainee.programmes.nomStatus.approved",
    rejected: "trainee.programmes.nomStatus.rejected",
    institution_confirmation: "trainee.programmes.nomStatus.institution_confirmation",
    batch_allocated: "trainee.programmes.nomStatus.batch_allocated",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-bold">{t("trainee.programmes.myNominations")}</h2>
        <Badge variant="secondary">{t(myNoms.length === 1 ? "trainee.programmes.nominationOne" : "trainee.programmes.nominationMany").replace("{count}", String(myNoms.length))}</Badge>
      </div>

      {myNoms.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center rounded-2xl border border-dashed border-border bg-muted/20">
          <FileText className="size-10 text-muted-foreground/40" />
          <p className="font-medium">{t("trainee.programmes.noNominations")}</p>
          <p className="text-sm text-muted-foreground">{t("trainee.programmes.noNominationsHint")}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {myNoms.map((nom) => (
            <Card key={nom.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{nom.programmeTitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{nom.institutionName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("trainee.programmes.nominatedBy")}: {nom.cooperativeName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("trainee.programmes.submittedOn")}: {new Date(nom.submittedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <Badge className={cn("shrink-0 text-xs", STATUS_COLOURS[nom.status] ?? "bg-muted text-muted-foreground")}>
                  {STATUS_LABELS_NOM[nom.status] ? t(STATUS_LABELS_NOM[nom.status]) : nom.status}
                </Badge>
              </div>

              {/* Mini timeline */}
              <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
                {nom.timeline.slice(-2).map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    <span className="font-medium text-foreground">{e.actor}</span>
                    <span>{e.action}</span>
                    <span className="ml-auto">{new Date(e.timestamp).toLocaleDateString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// We need this import inside
import { useNominations } from "@/lib/store/programme-store";
import { ExamsSection } from "./components/exams-section";
