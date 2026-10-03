"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Megaphone, MessageSquare, PenSquare, Search, Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trainerPost, useTrainerQuery } from "@/lib/trainer/api";
import { cn } from "@/lib/utils";

interface Conversation {
  user_id: string;
  name: string;
  role: string | null;
  batch: string | null;
  last_message: string;
  last_subject: string | null;
  last_at: string | null;
  last_from_me: boolean;
  unread: number;
}
interface ThreadMsg {
  id: string;
  from_me: boolean;
  subject: string | null;
  body: string;
  created_at: string | null;
  read: boolean;
}
interface Recipient {
  id: string;
  name: string;
  role: string;
  batch: string | null;
  batch_id: string | null;
}
interface Announcement {
  id: string;
  title: string;
  message: string;
  audience_type: string;
  audience: string;
  status: string;
  created_at: string | null;
}
interface ClassRow {
  id: string;
  course_id: string;
  course: string;
  batch: string;
  batch_id: string;
}

const selectCls =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function when(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const opts = { timeZone: "Asia/Kolkata" } as const;
  const sameDay = d.toLocaleDateString("en-IN", opts) === new Date().toLocaleDateString("en-IN", opts);
  return sameDay
    ? d.toLocaleTimeString("en-IN", { ...opts, hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-IN", { ...opts, day: "numeric", month: "short" });
}

/* ------------------------------ Compose dialog ----------------------------- */
function ComposeDialog({
  open,
  presetId,
  onClose,
  onSent,
}: {
  open: boolean;
  presetId: string | null;
  onClose: () => void;
  onSent: (userId: string) => void;
}) {
  const rec = useTrainerQuery<{ recipients: Recipient[] }>(open ? "/messages/recipients" : null);
  const [to, setTo] = useState(presetId ?? "");
  const [find, setFind] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = (rec.data?.recipients ?? []).filter((r) => r.name?.toLowerCase().includes(find.trim().toLowerCase()));

  async function send() {
    setBusy(true);
    setError(null);
    try {
      await trainerPost("/messages", { recipient_id: to, subject: subject.trim() || null, body: body.trim() });
      onSent(to);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>Send a message to a trainee in your batches or your institution admin.</DialogDescription>
        </DialogHeader>
        {rec.loading ? (
          <LoadingBlock rows={2} />
        ) : rec.error ? (
          <ErrorState message={rec.error} onRetry={rec.refetch} />
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="msg-find">Recipient</Label>
              <Input id="msg-find" placeholder="Search by name…" value={find} onChange={(e) => setFind(e.target.value)} />
              <select aria-label="Recipient" className={selectCls} value={to} onChange={(e) => setTo(e.target.value)} size={Math.min(5, Math.max(2, options.length))}>
                {options.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.batch ? `· ${r.batch}` : "· Institution admin"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg-subject">Subject (optional)</Label>
              <Input id="msg-subject" maxLength={255} value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg-body">Message</Label>
              <Textarea id="msg-body" maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={send} disabled={busy || !to || !body.trim()}>
            <Send className="size-4" /> {busy ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- Messages -------------------------------- */
function MessagesPane() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const list = useTrainerQuery<{ conversations: Conversation[]; unread_total: number }>(
    `/messages${debounced ? `?q=${encodeURIComponent(debounced)}` : ""}`,
    { pollMs: 30000 }
  );
  const [active, setActive] = useState<string | null>(null);
  const thread = useTrainerQuery<{ user: Recipient; messages: ThreadMsg[] }>(active ? `/messages/thread/${active}` : null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef<Set<string>>(new Set());

  // Mark incoming unread messages as read once a thread is open.
  const threadData = thread.data;
  useEffect(() => {
    if (!threadData) return;
    const unread = threadData.messages.filter((m) => !m.from_me && !m.read && !markedRef.current.has(m.id));
    if (!unread.length) return;
    unread.forEach((m) => markedRef.current.add(m.id));
    Promise.all(unread.map((m) => trainerPost(`/messages/${m.id}/read`)))
      .then(() => list.refetch())
      .catch(() => unread.forEach((m) => markedRef.current.delete(m.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadData]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [threadData?.messages.length]);

  async function sendReply() {
    if (!active || !reply.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      await trainerPost("/messages", { recipient_id: active, body: reply.trim() });
      setReply("");
      thread.refetch();
      list.refetch();
    } catch (e) {
      setSendError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  const convs = list.data?.conversations ?? [];

  return (
    <div className="grid min-h-[28rem] gap-4 lg:grid-cols-[22rem_1fr]">
      <div className={cn("flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm", active && "hidden lg:flex")}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input aria-label="Search messages" className="pl-8" placeholder="Search messages" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button onClick={() => setCompose(true)}>
            <PenSquare className="size-4" /> Compose
          </Button>
        </div>
        {list.loading ? (
          <LoadingBlock rows={4} />
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.refetch} />
        ) : convs.length === 0 ? (
          <EmptyState title={debounced ? "No conversations match" : "No messages yet"} hint="Use Compose to message a trainee." icon={MessageSquare} />
        ) : (
          <ul className="max-h-[32rem] space-y-1 overflow-y-auto">
            {convs.map((c) => (
              <li key={c.user_id}>
                <button
                  type="button"
                  onClick={() => setActive(c.user_id)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted",
                    active === c.user_id && "bg-muted"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{c.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{when(c.last_at)}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {c.last_from_me ? "You: " : ""}
                      {c.last_subject ? `${c.last_subject} · ` : ""}
                      {c.last_message}
                    </span>
                    {c.unread > 0 && <Badge className="shrink-0">{c.unread}</Badge>}
                  </span>
                  {c.batch && <span className="text-xs text-muted-foreground">{c.batch}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cn("flex min-h-[28rem] flex-col rounded-2xl border border-border/60 bg-card shadow-sm", !active && "hidden lg:flex")}>
        {!active ? (
          <div className="m-auto p-6">
            <EmptyState title="Select a conversation" hint="Choose a trainee on the left to read the thread." icon={MessageSquare} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Back to conversations" onClick={() => setActive(null)}>
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <p className="text-sm font-semibold">{thread.data?.user.name ?? "…"}</p>
                <p className="text-xs text-muted-foreground">{thread.data?.user.batch ?? (thread.data ? "Institution admin" : "")}</p>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "26rem" }}>
              {thread.loading ? (
                <LoadingBlock rows={3} />
              ) : thread.error ? (
                <ErrorState message={thread.error} onRetry={thread.refetch} />
              ) : thread.data?.messages.length === 0 ? (
                <EmptyState title="No messages in this thread" icon={MessageSquare} />
              ) : (
                thread.data?.messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.from_me ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm", m.from_me ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      {m.subject && <p className="mb-0.5 text-xs font-semibold opacity-80">{m.subject}</p>}
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="mt-1 text-[11px] opacity-70">{when(m.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>
            <div className="border-t border-border/60 p-3">
              {sendError && <p className="mb-2 text-sm text-destructive">{sendError}</p>}
              <div className="flex gap-2">
                <Textarea
                  aria-label="Reply"
                  className="min-h-10 flex-1"
                  placeholder="Write a reply…"
                  maxLength={5000}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <Button onClick={sendReply} disabled={sending || !reply.trim()} aria-label="Send reply">
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <ComposeDialog
        key={`${compose}-${active}`}
        open={compose}
        presetId={active}
        onClose={() => setCompose(false)}
        onSent={(uid) => {
          setCompose(false);
          setActive(uid);
          list.refetch();
          thread.refetch();
        }}
      />
    </div>
  );
}

/* ------------------------------- Announcements ----------------------------- */
function AnnouncementsPane() {
  const list = useTrainerQuery<{ announcements: Announcement[] }>("/announcements");
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Megaphone className="size-4" /> New announcement
        </Button>
      </div>
      {list.loading ? (
        <LoadingBlock rows={3} />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.refetch} />
      ) : list.data?.announcements.length === 0 ? (
        <EmptyState title="No announcements yet" hint="Post one to a batch, a course or specific trainees." icon={Megaphone} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.data?.announcements.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-heading font-semibold">{a.title}</p>
                <Badge variant={a.status === "sent" ? "secondary" : "outline"} className="capitalize">
                  {a.status}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{a.message}</p>
              <p className="mt-auto text-xs text-muted-foreground">
                {a.audience} · {when(a.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <AnnouncementDialog key={String(open)} open={open} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); list.refetch(); }} />
    </div>
  );
}

function AnnouncementDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const classes = useTrainerQuery<{ classes: ClassRow[] }>(open ? "/classes" : null);
  const rec = useTrainerQuery<{ recipients: Recipient[] }>(open ? "/messages/recipients" : null);
  const [audience, setAudience] = useState<"batch" | "course" | "trainees">("batch");
  const [pickedBatch, setPickedBatch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const batches = useMemo(() => {
    const m = new Map<string, string>();
    classes.data?.classes.forEach((c) => m.set(c.batch_id, c.batch));
    return [...m.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [classes.data]);
  const courses = (classes.data?.classes ?? []).filter((c) => c.batch_id === batchId);
  const batchTrainees = (rec.data?.recipients ?? []).filter((r) => r.batch_id === batchId);

  const batchId = pickedBatch || batches[0]?.id || "";
  const setBatchId = (id: string) => {
    setPickedBatch(id);
    setCourseId("");
    setPicked([]);
  };

  const valid =
    title.trim() && message.trim() && batchId && (audience !== "course" || courseId) && (audience !== "trainees" || picked.length > 0);

  async function submit(status: "sent" | "draft") {
    setBusy(true);
    setError(null);
    try {
      await trainerPost("/announcements", {
        title: title.trim(),
        message: message.trim(),
        audience_type: audience,
        batch_id: batchId,
        course_id: audience === "course" ? courseId : null,
        trainee_ids: audience === "trainees" ? picked : null,
        status,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
          <DialogDescription>Choose who should see it, then write the message.</DialogDescription>
        </DialogHeader>
        {classes.loading ? (
          <LoadingBlock rows={3} />
        ) : classes.error ? (
          <ErrorState message={classes.error} onRetry={classes.refetch} />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="an-aud">Audience</Label>
                <select id="an-aud" className={selectCls} value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)}>
                  <option value="batch">Whole batch</option>
                  <option value="course">A course in a batch</option>
                  <option value="trainees">Specific trainees</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="an-batch">Batch</Label>
                <select id="an-batch" className={selectCls} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {audience === "course" && (
              <div className="space-y-1.5">
                <Label htmlFor="an-course">Course</Label>
                <select id="an-course" className={selectCls} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {audience === "trainees" && (
              <div className="space-y-1.5">
                <Label>Trainees ({picked.length} selected)</Label>
                {rec.loading ? (
                  <LoadingBlock rows={1} />
                ) : (
                  <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-input p-2">
                    {batchTrainees.map((t) => (
                      <li key={t.id}>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={picked.includes(t.id)}
                            onChange={(e) => setPicked((p) => (e.target.checked ? [...p, t.id] : p.filter((x) => x !== t.id)))}
                          />
                          {t.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="an-title">Title</Label>
              <Input id="an-title" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="an-msg">Message</Label>
              <Textarea id="an-msg" maxLength={5000} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={busy || !valid} onClick={() => submit("draft")}>
            Save draft
          </Button>
          <Button disabled={busy || !valid} onClick={() => submit("sent")}>
            {busy ? "Posting…" : "Post announcement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- Page ---------------------------------- */
export function CommsView() {
  const [tab, setTab] = useState<"messages" | "announcements">("messages");
  const unread = useTrainerQuery<{ unread_total: number }>("/messages", { pollMs: 60000 });
  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Talk to trainees in your batches and post announcements to a batch, a course or selected trainees." />
      <div className="inline-flex rounded-xl border border-border/60 bg-card p-1" role="tablist">
        {(["messages", "announcements"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
            {t === "messages" && (unread.data?.unread_total ?? 0) > 0 ? ` (${unread.data?.unread_total})` : ""}
          </button>
        ))}
      </div>
      {tab === "messages" ? <MessagesPane /> : <AnnouncementsPane />}
    </div>
  );
}
