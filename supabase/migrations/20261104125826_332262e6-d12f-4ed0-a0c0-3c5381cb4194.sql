DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND 'public'=ANY(roles)
      AND (qual ILIKE '%is_super_admin%' OR with_check ILIKE '%is_super_admin%')
      AND policyname <> 'Anyone can read published resources'
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated', p.policyname, p.tablename);
  END LOOP;
END $$;

ALTER POLICY "Anyone can read published resources" ON public.resources USING (published);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_material_authorized(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_material_authorized(uuid) TO authenticated, service_role;