import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard, Section } from "@/components/site/page-shell";
import { AcademicFields, emptyAcademic } from "@/components/site/academic-fields";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const BUCKET = "course-pdfs";

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <Section><p className="text-muted-foreground">Loading…</p></Section>;
  if (!isAdmin)
    return <Section><GlassCard hover={false}>You don't have access to this page.</GlassCard></Section>;
  return (
    <Section>
      <h1 className="text-3xl font-bold">Admin · Courses & PDFs</h1>
      <NewCourse />
      <CourseList />
    </Section>
  );
}

function NewCourse() {
  const qc = useQueryClient();
  const [scope, setScope] = useState(emptyAcademic);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const n = (v: string) => v || null;
    setBusy(true);
    const { error } = await supabase.from("courses").insert({
      code: String(f.get("code")).trim().toUpperCase().slice(0, 20),
      title: String(f.get("title")).slice(0, 200),
      description: String(f.get("description") ?? "").slice(0, 2000),
      university_id: n(scope.university_id),
      faculty_id: n(scope.faculty_id),
      department_id: n(scope.department_id),
      academic_level_id: n(scope.academic_level_id),
      semester_id: n(scope.semester_id),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Course created.");
    form.reset();
    setScope(emptyAcademic);
    qc.invalidateQueries({ queryKey: ["admin-courses"] });
  }
  return (
    <GlassCard hover={false} className="mt-6">
      <h2 className="text-lg font-semibold">New course</h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label htmlFor="code">Code</Label><Input id="code" name="code" placeholder="CSC 201" required /></div>
          <div className="sm:col-span-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
        </div>
        <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" rows={2} /></div>
        <p className="text-sm text-muted-foreground">Who sees it — leave a field empty to include everyone.</p>
        <AcademicFields value={scope} onChange={setScope} />
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Create course"}</Button>
      </form>
    </GlassCard>
  );
}

function CourseList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,code,title,is_published,course_materials(id,file_name,storage_path,is_published,created_at)")
        .order("code");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-courses"] });

  async function togglePublish(table: "courses" | "course_materials", id: string, value: boolean) {
    const { error } = await supabase.from(table).update({ is_published: value }).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  }
  async function upload(courseId: string, file: File) {
    if (file.type !== "application/pdf") { toast.error("Please choose a PDF file."); return; }
    const path = `${courseId}/${crypto.randomUUID()}.pdf`;
    const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: "application/pdf" });
    if (up.error) { toast.error(up.error.message); return; }
    const { error } = await supabase.from("course_materials").insert({
      course_id: courseId, storage_path: path, file_name: file.name.slice(0, 200), description: "", page_count: 0,
    });
    if (error) { await supabase.storage.from(BUCKET).remove([path]); toast.error(error.message); return; }
    toast.success("PDF uploaded.");
    refresh();
  }
  async function removeMaterial(id: string, path: string) {
    if (!confirm("Delete this PDF?")) return;
    const { error } = await supabase.from("course_materials").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await supabase.storage.from(BUCKET).remove([path]);
    refresh();
  }

  if (isLoading) return <p className="mt-6 text-muted-foreground">Loading courses…</p>;
  if (!data?.length) return <p className="mt-6 text-muted-foreground">No courses yet.</p>;
  return (
    <div className="mt-8 space-y-4">
      {data.map((c) => (
        <GlassCard key={c.id} hover={false}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><span className="text-xs font-semibold text-primary">{c.code}</span><h3 className="font-semibold">{c.title}</h3></div>
            <div className="flex gap-2">
              <Button size="sm" variant={c.is_published ? "outline" : "default"} onClick={() => togglePublish("courses", c.id, !c.is_published)}>
                {c.is_published ? "Unpublish" : "Publish"}
              </Button>
              <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-input px-3 text-xs font-medium">
                Upload PDF
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(c.id, f); e.target.value = ""; }} />
              </label>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {c.course_materials.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2">
                <span>{m.file_name} {m.is_published ? "" : <em className="text-muted-foreground">(hidden)</em>}</span>
                <span className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => togglePublish("course_materials", m.id, !m.is_published)}>{m.is_published ? "Hide" : "Publish"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => removeMaterial(m.id, m.storage_path)}>Delete</Button>
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      ))}
    </div>
  );
}
