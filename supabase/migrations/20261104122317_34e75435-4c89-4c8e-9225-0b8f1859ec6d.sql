-- ============================================================
-- StudyAI - restrict EXECUTE on internal SECURITY DEFINER helpers
-- ============================================================

-- Trigger-only: runs when an account is created, never callable from the app.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Internal role lookup used by policy expressions and by the administrator check.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Trigger-only timestamp helper.
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Policy-evaluation helpers that must stay callable by the roles whose access they decide.
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_material_authorized(uuid) TO authenticated;

-- Materials eligibility is a signed-in decision only.
DROP POLICY IF EXISTS "Students read authorized materials" ON public.course_materials;
CREATE POLICY "Students read authorized materials" ON public.course_materials
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_material_authorized(id));