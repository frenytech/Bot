import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { ArrowUp, BookOpen, GraduationCap, Menu, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Thread = { id: string; title: string; course_id: string | null; updated_at: string };
type Msg = { id: string; role: "user" | "assistant"; content: string };

const db = supabase as any;

function useThreads() {
  return useQuery({
    queryKey: ["tutor-threads"],
    queryFn: async () => ((await db.from("tutor_threads").select("id,title,course_id,updated_at").order("updated_at", { ascending: false })).data ?? []) as Thread[],
  });
}

function useCourses() {
  return useQuery({
    queryKey: ["my-courses-lite"],
    queryFn: async () => (await supabase.from("courses").select("id,code,title").eq("is_published", true).order("code")).data ?? [],
  });
}

function TutorAvatar({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg", className)}>
      <GraduationCap className="size-4" />
    </span>
  );
}

export function TutorShell({ threadId }: { threadId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] max-w-7xl gap-4 px-3 py-4 sm:px-6">
      <aside className={cn(
        "glass-panel fixed inset-y-0 left-0 z-50 w-72 rounded-r-3xl p-4 transition-transform md:static md:z-auto md:translate-x-0 md:rounded-3xl",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <ThreadList activeId={threadId} onPick={() => setOpen(false)} onClose={() => setOpen(false)} />
      </aside>
      {open ? <button type="button" aria-label="Close chats" className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} /> : null}
      <main className="glass-panel relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl">
        <div className="pointer-events-none absolute inset-0 aurora-canvas opacity-40" />
        <div className="relative flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <Button size="icon" variant="ghost" className="md:hidden" aria-label="Open chats" onClick={() => setOpen(true)}><Menu className="size-5" /></Button>
          <TutorAvatar />
          <div className="min-w-0">
            <p className="font-semibold leading-tight">StudyAI Tutor</p>
            <p className="text-xs text-muted-foreground">Explains, quizzes and cites your past questions</p>
          </div>
        </div>
        {threadId ? <ChatWindow key={threadId} threadId={threadId} /> : <NewChat />}
      </main>
    </div>
  );
}

function ThreadList({ activeId, onPick, onClose }: { activeId?: string | undefined; onPick: () => void; onClose: () => void }) {
  const threads = useThreads();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function remove(id: string) {
    if (!confirm("Delete this chat?")) return;
    const { error } = await db.from("tutor_threads").delete().eq("id", id);
    if (error) { toast.error("Could not delete chat"); return; }
    qc.invalidateQueries({ queryKey: ["tutor-threads"] });
    if (id === activeId) navigate({ to: "/tutor" });
  }
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Chats</p>
        <Button size="icon" variant="ghost" className="md:hidden" aria-label="Close" onClick={onClose}><X className="size-4" /></Button>
      </div>
      <Button asChild className="glow-soft w-full justify-start gap-2" onClick={onPick}>
        <Link to="/tutor"><Plus className="size-4" /> New chat</Link>
      </Button>
      <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
        {threads.data?.length ? threads.data.map((t) => (
          <div key={t.id} className={cn("group flex items-center gap-1 rounded-xl pr-1 transition-colors", t.id === activeId ? "bg-primary/15" : "hover:bg-muted/50")}>
            <Link to="/tutor/$threadId" params={{ threadId: t.id }} onClick={onPick} className="min-w-0 flex-1 truncate px-3 py-2 text-sm">{t.title}</Link>
            <button type="button" aria-label="Delete chat" onClick={() => remove(t.id)} className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus:opacity-100"><Trash2 className="size-3.5" /></button>
          </div>
        )) : <p className="px-2 text-sm text-muted-foreground">{threads.isLoading ? "Loading…" : "No chats yet."}</p>}
      </div>
    </div>
  );
}

const STARTERS = [
  "Explain this topic like I'm new to it",
  "Quiz me with 5 questions",
  "Summarise the key exam points",
  "Help me solve a past question step by step",
];

function NewChat() {
  const { user } = useAuth();
  const courses = useCourses();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(first?: string) {
    if (!user) return;
    setBusy(true);
    const { data, error } = await db.from("tutor_threads").insert({ user_id: user.id, course_id: courseId || null }).select("id").single();
    setBusy(false);
    if (error) { toast.error("Could not start a chat"); return; }
    if (first) sessionStorage.setItem(`tutor-first-${data.id}`, first);
    qc.invalidateQueries({ queryKey: ["tutor-threads"] });
    navigate({ to: "/tutor/$threadId", params: { threadId: data.id } });
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 text-center">
      <TutorAvatar className="size-16 rounded-2xl [&_svg]:size-8" />
      <h1 className="mt-5 text-3xl font-bold sm:text-4xl">What are we <span className="text-gradient">learning</span> today?</h1>
      <p className="mt-2 max-w-md text-muted-foreground">Pick a course so the tutor can use its past questions, or just ask anything.</p>
      <label className="mt-6 flex w-full max-w-sm items-center gap-2 rounded-xl border border-border bg-background/60 px-3">
        <BookOpen className="size-4 text-primary" />
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="h-11 w-full bg-transparent text-sm outline-none">
          <option value="">Any subject</option>
          {courses.data?.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
        </select>
      </label>
      <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button key={s} type="button" disabled={busy} onClick={() => create(s)} className="glass-card rounded-2xl px-4 py-3 text-left text-sm transition-colors hover:border-primary/60">{s}</button>
        ))}
      </div>
      <Button className="mt-6" size="lg" disabled={busy} onClick={() => create()}><Plus className="size-4" /> Start a blank chat</Button>
    </div>
  );
}

function ChatWindow({ threadId }: { threadId: string }) {
  const qc = useQueryClient();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "submitted" | "streaming">("idle");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const sentFirst = useRef(false);

  useEffect(() => {
    let cancel = false;
    db.from("tutor_messages").select("id,role,content").eq("thread_id", threadId).order("created_at").then(({ data }: any) => {
      if (cancel) return;
      setMsgs(data ?? []);
      setLoaded(true);
    });
    return () => { cancel = true; };
  }, [threadId]);

  useEffect(() => {
    if (!loaded || sentFirst.current) return;
    sentFirst.current = true;
    const first = sessionStorage.getItem(`tutor-first-${threadId}`);
    if (first && msgs.length === 0) { sessionStorage.removeItem(`tutor-first-${threadId}`); void send(first); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, status]);
  useEffect(() => { if (status === "idle") taRef.current?.focus(); }, [status]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || status !== "idle") return;
    setInput("");
    setMsgs((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: message }]);
    setStatus("submitted");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ threadId, message }),
      });
      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        toast.error(`You've used today's ${j.limit ?? ""} tutor messages. Upgrade for more.`);
        setMsgs((m) => m.slice(0, -1)); setInput(message); setStatus("idle"); return;
      }
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        toast.error(text || "The tutor couldn't reply. Try again.");
        setMsgs((m) => m.slice(0, -1)); setInput(message); setStatus("idle"); return;
      }
      const id = `a-${Date.now()}`;
      setMsgs((m) => [...m, { id, role: "assistant", content: "" }]);
      setStatus("streaming");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMsgs((m) => m.map((x) => (x.id === id ? { ...x, content: x.content + chunk } : x)));
      }
      qc.invalidateQueries({ queryKey: ["tutor-threads"] });
    } catch (e) {
      toast.error((e as Error).message || "The tutor couldn't reply. Try again.");
    }
    setStatus("idle");
  }

  return (
    <>
      <div className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {loaded && !msgs.length && status === "idle" ? (
            <p className="pt-16 text-center text-muted-foreground">Ask your first question below.</p>
          ) : null}
          {msgs.map((m) => m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground shadow-lg">{m.content}</div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-3">
              <TutorAvatar />
              <div className="tutor-prose min-w-0 flex-1 pt-1"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>
            </div>
          ))}
          {status === "submitted" ? (
            <div className="flex gap-3"><TutorAvatar /><div className="flex items-center gap-1 pt-3">{[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 150}ms` }} />)}</div></div>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="relative border-t border-border/60 p-3 sm:p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-background/70 p-2 shadow-lg focus-within:border-primary/70">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }}
            rows={1}
            maxLength={4000}
            placeholder="Ask the tutor anything…"
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || status !== "idle"} aria-label="Send" className="size-10 shrink-0 rounded-xl"><ArrowUp className="size-4" /></Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">The tutor can make mistakes — check important facts with your course materials.</p>
      </form>
    </>
  );
}
