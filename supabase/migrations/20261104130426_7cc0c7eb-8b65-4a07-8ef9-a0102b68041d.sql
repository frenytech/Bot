DROP POLICY "Users manage their own daily reading usage" ON public.reading_daily_usage;
CREATE POLICY "Users read their own daily reading usage" ON public.reading_daily_usage FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.reading_daily_usage FROM authenticated, anon;
DROP POLICY "Users manage their own reading progress" ON public.reading_progress;
CREATE POLICY "Users read their own reading progress" ON public.reading_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.reading_progress FROM authenticated, anon;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reading_daily_usage_unique') THEN
    ALTER TABLE public.reading_daily_usage ADD CONSTRAINT reading_daily_usage_unique UNIQUE (user_id, usage_date, material_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reading_progress_unique') THEN
    ALTER TABLE public.reading_progress ADD CONSTRAINT reading_progress_unique UNIQUE (user_id, material_id);
  END IF;
END $$;