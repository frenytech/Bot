import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { scanPages, startScan } from "@/lib/scanner.functions";

/** Reads a PDF in the browser, then sends its text to the scanner in small batches. */
export function ScanButton({ materialId, path, onDone }: { materialId: string; path: string; onDone: () => void }) {
  const start = useServerFn(startScan);
  const scan = useServerFn(scanPages);
  const [progress, setProgress] = useState<number | null>(null);

  async function run() {
    try {
      setProgress(0);
      const dl = await supabase.storage.from("course-pdfs").download(path);
      if (dl.error) throw dl.error;
      const pdfjs = await import("pdfjs-dist");
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      const doc = await pdfjs.getDocument({ data: new Uint8Array(await dl.data.arrayBuffer()) }).promise;
      const pages: { page: number; text: string }[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const tc = await (await doc.getPage(i)).getTextContent();
        const text = tc.items.map((it: any) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join("");
        pages.push({ page: i, text: text.slice(0, 20000) });
      }
      const hasText = pages.some((p) => p.text.trim().length > 20);
      const { jobId } = await start({ data: { materialId, pagesTotal: doc.numPages, hasText } });
      let added = 0;
      for (let i = 0; i < pages.length; i += 4) {
        const r = await scan({ data: { jobId, materialId, pages: pages.slice(i, i + 4) } });
        added += r.added;
        setProgress(Math.round((Math.min(i + 4, pages.length) / pages.length) * 100));
      }
      toast.success(`Scan finished: ${added} questions found.${hasText ? "" : " This PDF has no selectable text."}`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setProgress(null);
    }
  }

  return (
    <Button size="sm" variant="ghost" disabled={progress !== null} onClick={run}>
      {progress === null ? "Scan questions" : `Scanning ${progress}%`}
    </Button>
  );
}
