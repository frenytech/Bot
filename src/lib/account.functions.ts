import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Provisions the single super administrator from a private server setting.
 *
 * A student can never grant themselves the administrator role: this handler
 * only writes the role when the signed-in email exactly matches the
 * SUPER_ADMIN_EMAIL value held on the server. Everyone else gets a no-op.
 */
export const ensureSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const configured = (process.env["SUPER_ADMIN_EMAIL"] ?? "").trim().toLowerCase();
    const email = (context.claims.email ?? "").toLowerCase();

    if (!configured || email !== configured) {
      return { provisioned: false };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "super_admin" }, { onConflict: "user_id,role" });

    if (error) throw error;
    return { provisioned: true };
  });

/**
 * Academic profile summary for the signed-in student, joined to the names of
 * their university, faculty, department, level and semester.
 */
export const getMyAcademicProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, university_id, faculty_id, department_id, academic_level_id, semester_id, avatar_url, onboarded",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!profile) return null;

    const [university, faculty, department, level, semester] = await Promise.all([
      profile.university_id
        ? supabase.from("universities").select("id, name").eq("id", profile.university_id).maybeSingle()
        : Promise.resolve({ data: null }),
      profile.faculty_id
        ? supabase.from("faculties").select("id, name").eq("id", profile.faculty_id).maybeSingle()
        : Promise.resolve({ data: null }),
      profile.department_id
        ? supabase.from("departments").select("id, name").eq("id", profile.department_id).maybeSingle()
        : Promise.resolve({ data: null }),
      profile.academic_level_id
        ? supabase.from("academic_levels").select("id, code, name").eq("id", profile.academic_level_id).maybeSingle()
        : Promise.resolve({ data: null }),
      profile.semester_id
        ? supabase.from("semesters").select("id, code, name").eq("id", profile.semester_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return {
      ...profile,
      university_name: university?.data?.name ?? null,
      faculty_name: faculty?.data?.name ?? null,
      department_name: department?.data?.name ?? null,
      level_code: level?.data?.code ?? null,
      semester_name: semester?.data?.name ?? null,
    };
  });
