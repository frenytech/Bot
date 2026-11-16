import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GlassCard, Section } from "@/components/site/page-shell";
import { getAdminOverview, setMessageStatus } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin_/overview")({
  head: () => ({ meta: [{ title: "Admin overview | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: Overview,
});

const tabs = ["Students", "Payments", "Messages", "AI usage"] as const;
const naira = (n: number) => `₦${n.toLocaleString()}`;
const day = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

function Overview() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Students");
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: () => getAdminOverview(), enabled: isAdmin });
  if (loading) return <Section><p className="text-muted-foreground">Loading…</p></Section>;
  if (!isAdmin) return <Section><GlassCard hover={false}>You don't have access to this page.</GlassCard></Section>;
  const d = q.data;
  const totalAi = d ? Object.values(d.aiByFeature).reduce((a, f) => a + f.calls, 0) : 0;

  return (
    <Section>
      <div className="relative overflow-hidden rounded-3xl glass-panel aurora-canvas p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Control centre</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Admin · <span className="text-gradient">Overview</span></h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/admin">Courses & PDFs</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/questions">Review questions</Link></Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Students", d?.students.length ?? "…"], ["Active plans", d?.activeSubs ?? "…"], ["Revenue", d ? naira(d.revenue) : "…"], ["AI requests (30d)", d ? totalAi : "…"]].map(([k, v]) => (
          <GlassCard key={k as string} hover={false}><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-2xl font-bold">{v}</p></GlassCard>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t}</Button>)}
      </div>

      <GlassCard hover={false} className="mt-4 overflow-x-auto">
        {!d ? <p className="text-muted-foreground">{q.isError ? "Couldn't load data." : "Loading…"}</p> : tab === "Students" ? (
          <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-2">Name</th><th>Department</th><th>Level</th><th>Joined</th></tr></thead>
            <tbody>{d.students.map((s) => <tr key={s.id} className="border-t border-border"><td className="py-2">{s.full_name || "—"}</td><td>{s.departments?.name ?? "—"}</td><td>{s.academic_levels?.name ?? "—"}</td><td>{day(s.created_at)}</td></tr>)}</tbody></table>
        ) : tab === "Payments" ? (
          <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-2">Email</th><th>Plan</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{d.payments.map((p) => <tr key={p.id} className="border-t border-border"><td className="py-2">{p.email}</td><td className="capitalize">{p.plan}</td><td>{naira(p.amount_naira)}</td><td className="capitalize">{p.status}</td><td>{day(p.paid_at ?? p.created_at)}</td></tr>)}</tbody></table>
        ) : tab === "Messages" ? (
          <div className="space-y-3">{d.messages.length === 0 ? <p className="text-muted-foreground">No messages yet.</p> : d.messages.map((m) => (
            <div key={m.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{m.subject}</p><span className="text-xs capitalize text-muted-foreground">{m.status} · {day(m.created_at)}</span></div>
              <p className="text-xs text-muted-foreground">{m.name} · {m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
              <div className="mt-3 flex gap-2">{(["read", "resolved"] as const).map((s) => (
                <Button key={s} size="sm" variant="outline" disabled={m.status === s} onClick={async () => { await setMessageStatus({ data: { id: m.id, status: s } }); qc.invalidateQueries({ queryKey: ["admin-overview"] }); }}>Mark {s}</Button>
              ))}</div>
            </div>))}</div>
        ) : (
          <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-2">Feature</th><th>Requests</th><th>Tokens</th></tr></thead>
            <tbody>{Object.entries(d.aiByFeature).map(([f, v]) => <tr key={f} className="border-t border-border"><td className="py-2 capitalize">{f.replace("_", " ")}</td><td>{v.calls}</td><td>{v.tokens.toLocaleString()}</td></tr>)}</tbody></table>
        )}
      </GlassCard>
    </Section>
  );
}
