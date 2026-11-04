CREATE POLICY "Admin manages course pdfs" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'course-pdfs' AND public.is_super_admin())
WITH CHECK (bucket_id = 'course-pdfs' AND public.is_super_admin());