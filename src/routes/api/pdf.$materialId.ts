import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

/** Streams a course PDF to a signed-in student who is allowed to see it and has opened it today. */
export const Route = createFileRoute("/api/pdf/$materialId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          global: { fetch: (i, init) => { const h = new Headers(init?.headers); h.set("apikey", key); h.set("Authorization", `Bearer ${token}`); return fetch(i, { ...init, headers: h }); } },
        });
        const { data: auth } = await sb.auth.getUser(token);
        const userId = auth.user?.id;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        // RLS decides whether this student may see the material.
        const { data: material } = await sb.from("course_materials").select("id,storage_path").eq("id", params.materialId).maybeSingle();
        if (!material) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const today = new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
        const { data: usage } = await supabaseAdmin.from("reading_daily_usage").select("id")
          .eq("user_id", userId).eq("material_id", material.id).eq("usage_date", today).maybeSingle();
        if (!usage) return new Response("Open the PDF first", { status: 403 });

        const file = await supabaseAdmin.storage.from("course-pdfs").download(material.storage_path);
        if (file.error || !file.data) return new Response("Could not load PDF", { status: 500 });
        return new Response(file.data, { headers: { "Content-Type": "application/pdf", "Cache-Control": "private, no-store" } });
      },
    },
  },
});
