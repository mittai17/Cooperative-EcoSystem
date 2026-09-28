"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bus,
  CalendarClock,
  Check,
  CircleAlert,
  ClipboardList,
  Inbox,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  Truck,
  TriangleAlert,
  Utensils,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
type LogisticsCategory = "Travel" | "Catering" | "Materials" | "Venue" | "Equipment";
type TaskFilter = "All" | "Open" | "Overdue" | "Done";
type CategoryFilter = LogisticsCategory | "All";

interface LogisticsTask {
  id: string;
  title: string;
  category: LogisticsCategory;
  programme: string;
  programmeCode: string;
  batchCode: string | null;
  dueDate: string;
  owner: string;
  done: boolean;
  estimatedCost: number;
}

interface VehicleAllocation {
  id: string;
  vehicleNo: string;
  type: string;
  seats: number;
  route: string;
  batchCode: string | null;
  pickUpPoint: string;
  departure: string;
  driver: string;
  driverPhone: string;
  status: "Confirmed" | "Awaiting confirmation";
}

interface ProgrammeOption {
  id: string;
  code: string;
  title: string;
}

interface LogisticsData {
  tasks: LogisticsTask[];
  vehicles: VehicleAllocation[];
  contingencyReserve: number;
  programmes: ProgrammeOption[];
}

const logisticsCategories: LogisticsCategory[] = [
  "Travel",
  "Catering",
  "Materials",
  "Venue",
  "Equipment",
];

const TASK_FILTERS: TaskFilter[] = ["All", "Open", "Overdue", "Done"];
const CATEGORY_FILTERS: CategoryFilter[] = ["All", ...logisticsCategories];

const CATEGORY_TONE: Record<LogisticsCategory, string> = {
  Travel: "bg-primary/10 text-primary",
  Catering: "bg-tint-amber-bg text-tint-amber-fg",
  Materials: "bg-tint-violet-bg text-tint-violet-fg",
  Venue: "bg-tint-green-bg text-tint-green-fg",
  Equipment: "bg-secondary text-secondary-foreground",
};

const CATEGORY_ICON: Record<LogisticsCategory, LucideIcon> = {
  Travel: Bus,
  Catering: Utensils,
  Materials: ClipboardList,
  Venue: Truck,
  Equipment: Check,
};

const TODAY_ISO = new Date().toISOString().slice(0, 10);

async function loadLogistics(): Promise<LogisticsData> {
  const res = await fetch(`${API_BASE}/api/v1/logistics/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

function isOverdue(task: LogisticsTask): boolean {
  return !task.done && task.dueDate < TODAY_ISO;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function isRealDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

interface TaskFormState {
  title: string;
  category: LogisticsCategory | "";
  programmeId: string;
  owner: string;
  dueDate: string;
  estimatedCost: string;
}

interface TaskFormErrors {
  title?: string;
  category?: string;
  programme?: string;
  owner?: string;
  dueDate?: string;
  estimatedCost?: string;
}

const EMPTY_FORM: TaskFormState = {
  title: "",
  category: "",
  programmeId: "",
  owner: "",
  dueDate: "",
  estimatedCost: "",
};

export default function LogisticsPage() {
  const [tasks, setTasks] = useState<LogisticsTask[]>([]);
  const [vehicles, setVehicles] = useState<VehicleAllocation[]>([]);
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [contingencyReserve, setContingencyReserve] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openTasks = tasks.filter((task) => !task.done);
  const overdueTasks = tasks.filter(isOverdue);
  const confirmedVehicles = vehicles.filter((item) => item.status === "Confirmed");

  async function refresh() {
    setLoadState("loading");
    try {
      const next = await loadLogistics();
      setTasks(next.tasks);
      setVehicles(next.vehicles);
      setProgrammes(next.programmes);
      setContingencyReserve(next.contingencyReserve);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (category !== "All" && task.category !== category) return false;
      if (taskFilter === "Open" && task.done) return false;
      if (taskFilter === "Done" && !task.done) return false;
      if (taskFilter === "Overdue" && !isOverdue(task)) return false;
      if (!needle) return true;
      return (
        task.title.toLowerCase().includes(needle) ||
        task.owner.toLowerCase().includes(needle) ||
        task.programme.toLowerCase().includes(needle)
      );
    });
  }, [tasks, category, taskFilter, query]);

  const filterCounts: Record<TaskFilter, number> = {
    All: tasks.length,
    Open: openTasks.length,
    Overdue: overdueTasks.length,
    Done: tasks.length - openTasks.length,
  };

  // Budget is derived from the task rows so the cards can never drift from the
  // checklist. Allocated = every task estimate plus the held-back contingency.
  const planned = tasks.reduce((sum, task) => sum + task.estimatedCost, 0);
  const spent = tasks
    .filter((task) => task.done)
    .reduce((sum, task) => sum + task.estimatedCost, 0);
  const committed = tasks
    .filter((task) => !task.done)
    .reduce((sum, task) => sum + task.estimatedCost, 0);
  const allocated = planned + contingencyReserve;
  const remaining = allocated - spent - committed;
  const utilisation = allocated === 0 ? 0 : (spent / allocated) * 100;
  const committedPct = allocated === 0 ? 0 : ((spent + committed) / allocated) * 100;

  const spendByCategory = useMemo(
    () =>
      logisticsCategories
        .map((item) => ({
          label: item,
          value: tasks
            .filter((task) => task.category === item)
            .reduce((sum, task) => sum + task.estimatedCost, 0),
        }))
        .sort((a, b) => b.value - a.value),
    [tasks],
  );

  const isFiltered = category !== "All" || taskFilter !== "All" || query.trim() !== "";

  async function toggleTask(id: string, done: boolean) {
    const previous = tasks;
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done } : task)));
    try {
      const res = await fetch(`${API_BASE}/api/v1/logistics/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const updated = (await res.json()) as LogisticsTask;
      setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)));
    } catch {
      setTasks(previous);
      setNotice("Could not update that task. Please try again.");
    }
  }

  function updateField<Key extends keyof TaskFormState>(key: Key, value: TaskFormState[Key]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function submitTask() {
    const next: TaskFormErrors = {};
    const title = form.title.trim();
    if (title.length < 5) next.title = "Describe the task in at least 5 characters.";
    if (!form.category) next.category = "Pick a category.";
    if (!form.programmeId) next.programme = "Link the task to a programme.";
    if (form.owner.trim().length < 3) next.owner = "Name the person accountable.";
    if (!form.dueDate) next.dueDate = "A due date is required.";
    else if (!isRealDate(form.dueDate)) next.dueDate = "Enter a valid date.";

    if (form.estimatedCost.trim() !== "") {
      const cost = Number(form.estimatedCost);
      if (!Number.isFinite(cost) || cost < 0)
        next.estimatedCost = "Estimate must be zero or a positive amount.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;
    if (!form.category) return;

    const cost = form.estimatedCost.trim() === "" ? 0 : Number(form.estimatedCost);

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/logistics/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category: form.category,
          programme_id: form.programmeId,
          owner: form.owner.trim(),
          due_date: form.dueDate,
          estimated_cost: cost,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({ detail: "Could not add the task." })) as { detail?: string };
        throw new Error(json.detail ?? "Could not add the task.");
      }
      const created = (await res.json()) as LogisticsTask;
      setTasks((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setErrors({});
      setTaskFilter("All");
      setCategory("All");
      setQuery("");
      setNotice(`Added ${created.title} to the checklist, owned by ${created.owner}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not add the task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Training Logistics"
        description="Every procurement, travel, catering and venue dependency behind a live cohort, with the budget it draws from."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="demo-data-tag">Live dataset · {tasks.length} tasks</span>
            <Button
              variant="outline"
              onClick={refresh}
              disabled={loadState === "loading"}
              aria-label="Refresh logistics checklist"
            >
              <RefreshCw className={loadState === "loading" ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        }
      />

      {notice && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-success/30 bg-success/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-success" />
            <p className="text-sm text-foreground">{notice}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open tasks"
          value={String(openTasks.length)}
          icon={ClipboardList}
          trend={`${filterCounts.Done} of ${tasks.length} settled`}
          trendTone="neutral"
        />
        <StatCard
          label="Overdue"
          value={String(overdueTasks.length)}
          icon={overdueTasks.length > 0 ? TriangleAlert : CalendarClock}
          trend={
            overdueTasks.length > 0
              ? `Oldest: ${formatDate(
                  overdueTasks.map((task) => task.dueDate).sort()[0] ?? TODAY_ISO,
                )}`
              : "Nothing past its due date"
          }
          trendTone={overdueTasks.length > 0 ? "down" : "up"}
        />
        <StatCard
          label="Vehicles confirmed"
          value={`${confirmedVehicles.length}/${vehicles.length}`}
          icon={Bus}
          trend={`${vehicles.reduce((sum, item) => sum + item.seats, 0)} seats reserved`}
          trendTone="neutral"
        />
        <StatCard
          label="Budget remaining"
          value={formatInr(remaining)}
          icon={Wallet}
          trend={`${Math.round(committedPct)}% of ${formatInr(allocated)} allocated`}
          trendTone={remaining === 0 ? "down" : "up"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-heading text-base">Delivery checklist</CardTitle>
                <CardDescription>
                  Tick an item once the dependency is settled — the budget cards update immediately.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-52">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search task or owner"
                    aria-label="Search logistics tasks"
                    className="h-9 pl-9"
                  />
                </div>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(String(value) as CategoryFilter)}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-9 w-full sm:w-40"
                    aria-label="Filter by category"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_FILTERS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item === "All" ? "All categories" : item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loadState === "error" ? (
              <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                <div className="flex items-start gap-2">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Could not load the checklist</p>
                    <p className="mt-1 text-sm text-foreground/70">
                      Logistics data did not resolve. Check your connection and try again.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={refresh}>
                  Try again
                </Button>
              </div>
            ) : loadState === "loading" ? (
              <div className="flex flex-col gap-2.5 rounded-lg border border-border p-4">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="size-4 rounded-[4px]" />
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="ml-auto h-4 w-20" />
                  </div>
                ))}
                <p className="pt-1 text-xs text-foreground/60">Loading checklist…</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
                  {TASK_FILTERS.map((item) => (
                    <Button
                      key={item}
                      variant={taskFilter === item ? "secondary" : "ghost"}
                      size="sm"
                      aria-pressed={taskFilter === item}
                      onClick={() => setTaskFilter(item)}
                    >
                      {item}
                      <span className="ml-1.5 font-mono text-xs">{filterCounts[item]}</span>
                    </Button>
                  ))}
                  {isFiltered && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTaskFilter("All");
                        setCategory("All");
                        setQuery("");
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>

                {visible.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
                    <span className="icon-tile-red size-10">
                      <Inbox className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isFiltered
                          ? "No tasks match this filter"
                          : openTasks.length === 0
                            ? "Every dependency is settled"
                            : "Nothing on the checklist yet"}
                      </p>
                      <p className="mx-auto mt-1 max-w-md text-sm text-foreground/70">
                        {isFiltered
                          ? "Try a different status, category, or search term."
                          : openTasks.length === 0
                            ? "All travel, catering, material and venue items for the current cohorts are closed out."
                            : "Add the first procurement or travel item to start tracking delivery."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {visible.map((task) => {
                      const Icon = CATEGORY_ICON[task.category];
                      const late = isOverdue(task);
                      return (
                        <li
                          key={task.id}
                          className={cn(
                            "flex flex-col gap-3 rounded-lg border border-border p-3 transition-colors sm:flex-row sm:items-start",
                            task.done ? "bg-muted/40" : "bg-card",
                          )}
                        >
                          <Checkbox
                            checked={task.done}
                            onCheckedChange={(checked) => toggleTask(task.id, checked)}
                            aria-label={`Mark ${task.title} as ${task.done ? "open" : "done"}`}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-sm font-medium",
                                task.done ? "text-foreground/60 line-through" : "text-foreground",
                              )}
                            >
                              {task.title}
                            </p>
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/60">
                              <Badge variant="secondary" className={CATEGORY_TONE[task.category]}>
                                <Icon className="size-3" />
                                {task.category}
                              </Badge>
                              <span className="font-mono">{task.programmeCode}</span>
                              <span>{task.owner}</span>
                              {task.estimatedCost > 0 && (
                                <span className="font-mono">{formatInr(task.estimatedCost)}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                            <span
                              className={cn(
                                "font-mono text-xs",
                                late ? "font-semibold text-destructive" : "text-foreground/70",
                              )}
                            >
                              {late ? "Overdue · " : "Due "}
                              {formatDate(task.dueDate)}
                            </span>
                            {task.done ? (
                              <Badge variant="secondary" className="bg-success/10 text-success">
                                Done
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-foreground/70">
                                Open
                              </Badge>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Training budget</CardTitle>
              <CardDescription>
                Derived live from the checklist — spent counts settled items, committed counts open
                ones.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm text-foreground">Sanctioned and drawn</p>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {formatInr(spent)} / {formatInr(allocated)}
                  </p>
                </div>
                <Progress value={utilisation} className="mt-2" />
                <div className="mt-2 flex items-center justify-between text-xs text-foreground/60">
                  <span className="font-mono">{Math.round(utilisation)}% settled</span>
                  <span className="font-mono">{Math.round(committedPct)}% committed</span>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3">
                <BudgetCell label="Allocated" value={formatInr(allocated)} hint="Includes reserve" />
                <BudgetCell label="Committed" value={formatInr(committed)} hint="Open items" />
                <BudgetCell label="Spent" value={formatInr(spent)} hint="Settled items" />
                <BudgetCell
                  label="Remaining"
                  value={formatInr(remaining)}
                  hint="Contingency reserve"
                  emphasis
                />
              </dl>

              <div className="border-t border-border pt-4">
                <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <TrendingDown className="size-3.5" />
                  Planned spend by category
                </p>
                <HorizontalBarList
                  items={spendByCategory}
                  barColorClassName="bg-chart-1"
                  valueFormatter={(value) => formatInr(value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Add a logistics item</CardTitle>
          <CardDescription>
            Anything the cohort depends on — travel, catering, materials, venue or equipment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              submitTask();
            }}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <Label htmlFor="task-title">Task</Label>
                <Input
                  id="task-title"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Book two mini buses for the Anand dairy procurement visit"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? "task-title-error" : undefined}
                  className="mt-1.5"
                />
                <FormError id="task-title-error" message={errors.title} />
              </div>

              <div>
                <Label htmlFor="task-category">Category</Label>
                <Select
                  value={form.category || null}
                  onValueChange={(value) =>
                    updateField("category", String(value) as LogisticsCategory)
                  }
                >
                  <SelectTrigger
                    id="task-category"
                    size="sm"
                    className="mt-1.5 w-full"
                    aria-label="Logistics category"
                    aria-invalid={Boolean(errors.category)}
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {logisticsCategories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError id="task-category-error" message={errors.category} />
              </div>

              <div>
                <Label htmlFor="task-programme">Linked programme</Label>
                <Select
                  value={form.programmeId || null}
                  onValueChange={(value) => updateField("programmeId", String(value))}
                >
                  <SelectTrigger
                    id="task-programme"
                    size="sm"
                    className="mt-1.5 w-full"
                    aria-label="Linked programme"
                    aria-invalid={Boolean(errors.programme)}
                  >
                    <SelectValue placeholder="Select a programme" />
                  </SelectTrigger>
                  <SelectContent>
                    {programmes.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError id="task-programme-error" message={errors.programme} />
              </div>

              <div>
                <Label htmlFor="task-owner">Owner</Label>
                <Input
                  id="task-owner"
                  value={form.owner}
                  onChange={(event) => updateField("owner", event.target.value)}
                  placeholder="Mr. Sanjay Kulkarni"
                  aria-invalid={Boolean(errors.owner)}
                  aria-describedby={errors.owner ? "task-owner-error" : undefined}
                  className="mt-1.5"
                />
                <FormError id="task-owner-error" message={errors.owner} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="task-due">Due date</Label>
                  <Input
                    id="task-due"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => updateField("dueDate", event.target.value)}
                    aria-invalid={Boolean(errors.dueDate)}
                    aria-describedby={errors.dueDate ? "task-due-error" : undefined}
                    className="mt-1.5 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="task-cost">Estimate (INR)</Label>
                  <Input
                    id="task-cost"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={form.estimatedCost}
                    onChange={(event) => updateField("estimatedCost", event.target.value)}
                    placeholder="0"
                    aria-invalid={Boolean(errors.estimatedCost)}
                    aria-describedby={errors.estimatedCost ? "task-cost-error" : undefined}
                    className="mt-1.5 font-mono"
                  />
                </div>
              </div>
              <FormError id="task-due-error" message={errors.dueDate} />
              <FormError id="task-cost-error" message={errors.estimatedCost} />
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-foreground/60">
                The estimate feeds the training budget above. Leave it at zero for internal,
                non-procurement work.
              </p>
              <Button type="submit" disabled={submitting}>
                <Plus className="mr-1.5 size-4" />
                Add to checklist
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Vehicle and transport allocation</CardTitle>
          <CardDescription>
            Vehicles held against a batch, with the pick-up point and driver contact for the day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center">
              <span className="icon-tile-red size-10">
                <Bus className="size-5" />
              </span>
              <p className="text-sm text-foreground/70">
                No vehicle is allocated to a batch right now.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table className="min-w-[940px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type &amp; seats</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Pick-up &amp; departure</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {item.vehicleNo}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground">{item.type}</p>
                        <p className="font-mono text-xs text-foreground/60">{item.seats} seats</p>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[220px] text-sm text-foreground">{item.route}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground/70">
                        {item.batchCode}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[200px] truncate text-sm text-foreground">
                          {item.pickUpPoint}
                        </p>
                        <p className="font-mono text-xs text-foreground/60">departs {item.departure}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground">{item.driver}</p>
                        <p className="font-mono text-xs text-foreground/60">{item.driverPhone}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            item.status === "Confirmed"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FormError({ message, id }: { message?: string; id: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

function BudgetCell({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        emphasis ? "border-primary/30 bg-primary/5" : "border-border bg-card",
      )}
    >
      <dt className="text-xs text-foreground/60">{label}</dt>
      <dd className="mt-1 font-mono text-base font-semibold text-foreground">{value}</dd>
      <dd className="mt-0.5 text-xs text-foreground/60">{hint}</dd>
    </div>
  );
}
