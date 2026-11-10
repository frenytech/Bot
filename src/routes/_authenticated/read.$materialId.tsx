import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard, Section } from "@/components/site/page-shell";
import { openMaterial, recordPage } from "@/lib/reading.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/read/$materialId")({
  head: () => ({ meta: [{ title: "Reader | StudyAI" }, { name: "robots", content: "noindex" }] }),
  component: Reader,
});

type Opened = Extract<Awaited<ReturnType<typeof openMaterial>>, { ok: true }>;

function Reader() {
  const { materialId } = Route.useParams();
  const [state, setState] = useState<"loading" | "error" | "limit" | "ready">("loading");
  const [info, setInfo] = useState<Opened | null>(null);
  const [message, setMessage] = useState("");
  const [doc, setDoc] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [locked, setLocked] = useState(false);
  const [usedToday, setUsedToday] = useState(0);
  const seen = useRef(new Set<number>());
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await openMaterial({ data: { materialId } });
        if (!res.ok) {
          setState(res.reason === "pdf_limit" ? "limit" : "error");
          setMessage(res.reason === "pdf_limit"
            ? `You've opened ${res.limit} PDFs today. Upgrade or come back after midnight.`
            : "This PDF isn't available for your programme.");
          return;
        }
        const pdfjs = await import("pdfjs-dist");
        const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const { data: { session } } = await supabase.auth.getSession();
        const file = await fetch(`/api/pdf/${materialId}`, { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } });
        if (!file.ok) throw new Error("download failed");
        const raw = new Uint8Array(await file.arrayBuffer());
        const loaded = await pdfjs.getDocument({ data: raw }).promise;
        if (cancelled) return;
        setInfo(res);
        setUsedToday(res.pagesReadToday);
        setDoc(loaded);
        setPage(Math.min(res.lastPage, loaded.numPages));
        setState("ready");
      } catch {
        if (!cancelled) { setState("error"); setMessage("We couldn't open this PDF. Please try again."); }
      }
    })();
    return () => { cancelled = true; };
  }, [materialId]);

  useEffect(() => {
    if (!doc || !canvas.current) return;
    let task: any;
    (async () => {
      if (!seen.current.has(page)) {
        const r = await recordPage({ data: { materialId, page, totalPages: doc.numPages } });
        setUsedToday(r.pagesReadToday);
        if (!r.allowed) { setLocked(true); } else { seen.current.add(page); setLocked(false); }
      } else setLocked(false);
      const p = await doc.getPage(page);
      const viewport = p.getViewport({ scale: 1.5 });
      const c = canvas.current!;
      c.width = viewport.width;
      c.height = viewport.height;
      task = p.render({ canvasContext: c.getContext("2d")!, viewport, canvas: c });
      await task.promise.catch(() => {});
    })();
    return () => task?.cancel();
  }, [doc, page, materialId]);

  if (state === "loading") return <Section><p className="text-muted-foreground">Opening PDF…</p></Section>;
  if (state !== "ready" || !info)
    return (
      <Section className="max-w-lg">
        <GlassCard hover={false}>
          <p>{message}</p>
          <div className="mt-4 flex gap-2">
            <Button asChild variant="outline"><Link to="/dashboard">Back to dashboard</Link></Button>
            {state === "limit" ? <Button asChild><Link to="/pricing">See plans</Link></Button> : null}
          </div>
        </GlassCard>
      </Section>
    );

  const total = doc.numPages as number;
  return (
    <Section className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary">{info.course?.code}</p>
          <h1 className="text-xl font-bold">{info.fileName}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {info.pageLimit === null ? "Unlimited pages" : `${usedToday}/${info.pageLimit} pages today`}
        </p>
      </div>
      <div
        className="relative mt-4 overflow-hidden rounded-xl border border-border bg-card select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={canvas} className={`mx-auto block h-auto max-w-full ${locked ? "blur-lg" : ""}`} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="-rotate-30 text-2xl font-bold text-foreground/10 md:text-4xl">{info.watermark}</span>
        </div>
        {locked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 p-6 text-center">
            <Lock className="size-8 text-primary" />
            <p className="font-semibold">You've reached today's page limit for this PDF.</p>
            <Button asChild><Link to="/pricing">Upgrade to keep reading</Link></Button>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-center gap-4">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="size-4" />Prev</Button>
        <span className="text-sm">Page {page} of {total}</span>
        <Button variant="outline" size="sm" disabled={page >= total} onClick={() => setPage(page + 1)}>Next<ChevronRight className="size-4" /></Button>
      </div>
    </Section>
  );
}
