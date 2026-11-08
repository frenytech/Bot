import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GlassCard, Section } from "@/components/site/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getFlashcards } from "@/lib/study.functions";

export const Route = createFileRoute("/_authenticated/flashcards")({
  head: () => ({ meta: [{ title: "Flashcards | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: Flashcards,
});

type Card = Awaited<ReturnType<typeof getFlashcards>>[number];

function Flashcards() {
  const { user } = useAuth();
  const load = useServerFn(getFlashcards);
  const courses = useQuery({
    queryKey: ["my-courses-lite"],
    queryFn: async () => (await supabase.from("courses").select("id,code,title").eq("is_published", true).order("code")).data ?? [],
  });
  const [cards, setCards] = useState<Card[] | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);

  async function start(courseId: string) {
    try {
      const all = await load({ data: { courseId } });
      const deck = (onlyNew ? all.filter((c) => !c.understood) : all).sort(() => Math.random() - 0.5);
      if (!deck.length) { toast.info("No flashcards available for this course yet."); return; }
      setCards(deck); setI(0); setFlipped(false);
    } catch (e) { toast.error((e as Error).message); }
  }
  async function mark(understood: boolean) {
    if (!cards || !user) return;
    const c = cards[i]; if (!c) return;
    await (supabase as any).from("flashcard_reviews").upsert({ user_id: user.id, question_id: c.id, understood, reviewed_at: new Date().toISOString() }, { onConflict: "user_id,question_id" });
    setCards(cards.map((x, k) => (k === i ? { ...x, understood } : x)));
    setFlipped(false);
    setI((n) => Math.min(n + 1, cards.length));
  }

  if (cards) {
    const done = i >= cards.length;
    const known = cards.filter((c) => c.understood).length;
    return (
      <Section>
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{done ? "Session complete" : `Card ${i + 1} of ${cards.length}`}</span>
            <span>{known} understood</span>
          </div>
          {done ? (
            <GlassCard hover={false} className="mt-4 text-center">
              <p className="text-2xl font-bold">{known} / {cards.length}</p>
              <p className="mt-1 text-muted-foreground">cards understood</p>
              <Button className="mt-4" onClick={() => setCards(null)}>Back to courses</Button>
            </GlassCard>
          ) : (
            <>
              <button type="button" onClick={() => setFlipped((f) => !f)} className="glass mt-4 flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border border-border p-6 text-center">
                <span className="text-xs uppercase tracking-wide text-primary">{flipped ? "Answer" : "Question"}</span>
                <p className="mt-3 text-lg">{flipped ? cards[i]!.back : cards[i]!.front}</p>
                {flipped && cards[i]!.page ? <p className="mt-3 text-xs text-muted-foreground">Source: page {cards[i]!.page}</p> : null}
                {!flipped ? <p className="mt-4 text-xs text-muted-foreground">Tap to reveal</p> : null}
              </button>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => mark(false)}>Still learning</Button>
                <Button onClick={() => mark(true)}>Understood</Button>
              </div>
            </>
          )}
        </div>
      </Section>
    );
  }
  return (
    <Section>
      <h1 className="text-3xl font-bold">Flashcards</h1>
      <p className="mt-2 text-muted-foreground">Review past questions from your courses and track what you've mastered.</p>
      <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} /> Only cards I haven't understood yet</label>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {courses.isLoading ? <p className="text-muted-foreground">Loading…</p> : !courses.data?.length ? <p className="text-muted-foreground">No courses yet.</p> : courses.data.map((c) => (
          <GlassCard key={c.id}>
            <p className="text-xs font-semibold text-primary">{c.code}</p>
            <h3 className="mt-1 font-semibold">{c.title}</h3>
            <Button size="sm" className="mt-3" onClick={() => start(c.id)}>Start review</Button>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
