import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

/**
 * Attaches the signed-in student's Supabase bearer token to every server
 * function call, so `requireSupabaseAuth` handlers can verify it and RLS
 * applies as that user.
 *
 * Registered globally in src/start.ts as `functionMiddleware`.
 */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    return next({
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
  },
);
