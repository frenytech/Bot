import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, Section } from "@/components/site/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { generateNotes } from "@/lib/study.functions";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [{ title: "AI Study Notes | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: Notes,
});

type Note = { id: string; topic: string; content: string; created_at: string; course_id: string | null };

function Notes() {
  const qc = useQueryClient();
  const gen = useServerFn(generateNotes);
  const courses = useQuery({
    queryKey: ["my-courses-lite"],
    queryFn: async () => (await supabase.from("courses").select("id,code,title").eq("is_published", true).order("code")).data ?? [],
  });
  const notes = useQuery({
    queryKey: ["my-notes"],
    queryFn: async () => ((await (supabase as any).from("study_notes").select("id,topic,content,created_at,course_id").order("created_at", { ascending: false })).data ?? []) as Note[],
  });
  const [courseId, setCourseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const topic = String(new FormData(e.currentTarget).get("topic") ?? "");
    if (!courseId) { toast.error("Pick a course."); return; }
    setBusy(true);
    try {
      const n = await gen({ data: { courseId, topic } });
      toast.success("Notes ready.");
      setOpen(n.id);
      qc.invalidateQueries({ queryKey: ["my-notes"] });
    } catch (err) { toast.error((err as Error).message); }
    setBusy(false);
  }
  async function remove(id: string) {
    if (!confirm("Delete these notes?")) return;
    await (supabase as any).from("study_notes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-notes"] });
  }
  const codeOf = (id: string | null) => courses.data?.find((c) => c.id === id)?.code ?? "";

  return (
    <Section>
      <h1 className="text-3xl font-bold">AI Study Notes</h1>
      <p className="mt-2 text-muted-foreground">Pick a course and a topic. StudyAI writes focused notes based on your course's past questions.</p>
      <GlassCard hover={false} className="mt-6">
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <div>
            <Label htmlFor="course">Course</Label>
            <select id="course" value={courseId} onChange={(e) => setCourseId(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
              <option value="">Select…</option>
              {courses.data?.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
            </select>
          </div>
          <div><Label htmlFor="topic">Topic</Label><Input id="topic" name="topic" placeholder="e.g. Binary search trees" required minLength={2} maxLength={200} /></div>
          <Button type="submit" disabled={busy}>{busy ? "Writing…" : "Generate notes"}</Button>
        </form>
      </GlassCard>
      <h2 className="mt-10 text-xl font-semibold">Saved notes</h2>
      <div className="mt-4 space-y-3">
        {notes.isLoading ? <p className="text-muted-foreground">Loading…</p> : !notes.data?.length ? <p className="text-muted-foreground">No notes yet.</p> : notes.data.map((n) => (
          <GlassCard key={n.id} hover={false}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" className="text-left" onClick={() => setOpen(open === n.id ? null : n.id)}>
                <span className="text-xs font-semibold text-primary">{codeOf(n.course_id)}</span>
                <h3 className="font-semibold">{n.topic}</h3>
              </button>
              <Button size="sm" variant="ghost" onClick={() => remove(n.id)}>Delete</Button>
            </div>
            {open === n.id ? <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{n.content}</div> : null}
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
