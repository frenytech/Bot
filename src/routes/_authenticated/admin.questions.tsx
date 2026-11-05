import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { GlassCard, Section } from "@/components/site/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/questions")({
  head: () => ({ meta: [{ title: "Question review | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: ReviewPage,
});

type Status = "pending_review" | "approved" | "rejected" | "published";
const TABS: { v: Status; label: string }[] = [
  { v: "pending_review", label: "Awaiting review" },
  { v: "approved", label: "Approved" },
  { v: "published", label: "Published" },
  { v: "rejected", label: "Rejected" },
];

function ReviewPage() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Status>("pending_review");
  const q = useQuery({
    queryKey: ["review", tab],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extracted_questions")
        .select("id,question_text,options,correct_option,page_number,topic,exam_year,flags,course_materials(file_name)")
        .eq("status", tab).order("created_at").limit(100);
      if (error) throw error;
      return data;
    },
  });
  if (loading) return <Section><p className="text-muted-foreground">Loading…</p></Section>;
  if (!isAdmin) return <Section><GlassCard hover={false}>You don't have access to this page.</GlassCard></Section>;
  return (
    <Section>
      <Link to="/admin" className="text-sm text-primary hover:underline">← Back to courses</Link>
      <h1 className="mt-2 text-3xl font-bold">Question review</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.v} size="sm" variant={tab === t.v ? "default" : "outline"} onClick={() => setTab(t.v)}>{t.label}</Button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {q.isLoading ? <p className="text-muted-foreground">Loading…</p> : !q.data?.length ? (
          <p className="text-muted-foreground">Nothing here.</p>
        ) : q.data.map((row) => <QuestionCard key={row.id} row={row as any} />)}
      </div>
    </Section>
  );
}

function QuestionCard({ row }: { row: any }) {
  const qc = useQueryClient();
  const [text, setText] = useState<string>(row.question_text);
  const [opts, setOpts] = useState<Record<string, string>>(row.options ?? {});
  const [answer, setAnswer] = useState<string>(row.correct_option ?? "");
  const flags: string[] = Array.isArray(row.flags) ? row.flags : [];

  async function save(status?: Status) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("extracted_questions").update({
      question_text: text.slice(0, 5000), options: opts, correct_option: answer.trim().toUpperCase() || null,
      ...(status ? { status, reviewed_at: new Date().toISOString(), reviewed_by: u.user?.id ?? null } : {}),
    }).eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success(status ? "Updated." : "Saved.");
    qc.invalidateQueries({ queryKey: ["review"] });
  }

  return (
    <GlassCard hover={false}>
      <p className="text-xs text-muted-foreground">
        {row.course_materials?.file_name} · page {row.page_number ?? "?"}{row.exam_year ? ` · ${row.exam_year}` : ""}{row.topic ? ` · ${row.topic}` : ""}
        {flags.map((f) => <span key={f} className="ml-2 rounded bg-destructive/15 px-1.5 py-0.5 text-destructive">{f.replace("_", " ")}</span>)}
      </p>
      <Textarea className="mt-2" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {Object.keys(opts).map((k) => (
          <div key={k} className="flex items-center gap-2">
            <span className="w-5 font-semibold">{k}</span>
            <Input value={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm">Answer</span>
        <Input className="w-16" value={answer} maxLength={2} onChange={(e) => setAnswer(e.target.value)} />
        <Button size="sm" variant="outline" onClick={() => save()}>Save</Button>
        <Button size="sm" onClick={() => save("approved")}>Approve</Button>
        <Button size="sm" onClick={() => save("published")}>Publish</Button>
        <Button size="sm" variant="ghost" onClick={() => save("rejected")}>Reject</Button>
      </div>
    </GlassCard>
  );
}
