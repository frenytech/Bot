import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GlassCard, Section } from "@/components/site/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { gradeTest, startTest } from "@/lib/cbt.functions";

export const Route = createFileRoute("/_authenticated/cbt")({
  head: () => ({ meta: [{ title: "Practice tests | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: CbtPage,
});

type Q = { id: string; text: string; options: Record<string, string>; page: number | null };
type Result = { score: number; total: number; correct: Record<string, string> };

function CbtPage() {
  const start = useServerFn(startTest);
  const grade = useServerFn(gradeTest);
  const courses = useQuery({
    queryKey: ["cbt-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id,code,title").eq("is_published", true).order("code");
      if (error) throw error;
      return data;
    },
  });
  const [courseId, setCourseId] = useState("");
  const [count, setCount] = useState(20);
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [qs, setQs] = useState<Q[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!qs || result || mode !== "exam") return;
    if (left <= 0) { void submit(); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, qs, result, mode]);

  async function begin() {
    if (!courseId) { toast.error("Choose a course."); return; }
    setBusy(true);
    try {
      const r = await start({ data: { courseId, count } });
      if (!r.questions.length) { toast.error("No questions published for this course yet."); return; }
      setQs(r.questions); setIdx(0); setAnswers({}); setResult(null); setLeft(r.questions.length * 60);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not start"); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (!qs) return;
    const all = Object.fromEntries(qs.map((q) => [q.id, answers[q.id] ?? ""]));
    try { setResult(await grade({ data: { answers: all } })); } catch { toast.error("Could not grade the test."); }
  }

  if (!qs) {
    return (
      <Section>
        <h1 className="text-3xl font-bold">Practice tests</h1>
        <GlassCard hover={false} className="mt-6 space-y-4">
          <label className="block text-sm">Course
            <select className="mt-1 w-full rounded-md border border-input bg-background p-2" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Choose…</option>
              {courses.data?.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
            </select>
          </label>
          <label className="block text-sm">Number of questions
            <select className="mt-1 w-full rounded-md border border-input bg-background p-2" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div className="flex gap-2">
            <Button variant={mode === "practice" ? "default" : "outline"} onClick={() => setMode("practice")}>Practice (no timer)</Button>
            <Button variant={mode === "exam" ? "default" : "outline"} onClick={() => setMode("exam")}>Exam (timed)</Button>
          </div>
          <Button onClick={begin} disabled={busy}>{busy ? "Loading…" : "Start test"}</Button>
        </GlassCard>
      </Section>
    );
  }

  if (result) {
    return (
      <Section>
        <h1 className="text-3xl font-bold">You scored {result.score}/{result.total} ({Math.round((result.score / result.total) * 100)}%)</h1>
        <div className="mt-6 space-y-3">
          {qs.map((q, i) => {
            const mine = answers[q.id]; const right = result.correct[q.id] ?? "";
            return (
              <GlassCard key={q.id} hover={false}>
                <p className="font-medium">{i + 1}. {q.text}</p>
                <p className="mt-2 text-sm">Your answer: <b className={mine === right ? "text-primary" : "text-destructive"}>{mine || "—"}</b> · Correct: <b>{right}{q.options[right] ? ` (${q.options[right]})` : ""}</b>{q.page ? ` · page ${q.page}` : ""}</p>
              </GlassCard>
            );
          })}
        </div>
        <Button className="mt-6" onClick={() => setQs(null)}>New test</Button>
      </Section>
    );
  }

  const q = qs[idx]!;
  return (
    <Section>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Question {idx + 1} of {qs.length}</p>
        {mode === "exam" ? <p className="font-mono text-sm">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</p> : null}
      </div>
      <GlassCard hover={false} className="mt-4">
        <p className="text-lg font-medium">{q.text}</p>
        <div className="mt-4 space-y-2">
          {Object.entries(q.options).map(([k, v]) => (
            <button key={k} onClick={() => setAnswers({ ...answers, [q.id]: k })}
              className={`w-full rounded-lg border p-3 text-left ${answers[q.id] === k ? "border-primary bg-primary/10" : "border-border"}`}>
              <b className="mr-2">{k}.</b>{v}
            </button>
          ))}
        </div>
      </GlassCard>
      <div className="mt-4 flex flex-wrap gap-2">
        {qs.map((x, i) => (
          <button key={x.id} onClick={() => setIdx(i)} className={`h-8 w-8 rounded text-xs ${i === idx ? "bg-primary text-primary-foreground" : answers[x.id] ? "bg-primary/20" : "border border-border"}`}>{i + 1}</button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</Button>
        {idx < qs.length - 1 ? <Button onClick={() => setIdx(idx + 1)}>Next</Button> : <Button onClick={submit}>Submit</Button>}
      </div>
    </Section>
  );
}
