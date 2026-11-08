-- Lets the signed-in admin create/edit courses, PDFs, directory entries and review questions.
-- Row-level security still limits every write to the super-admin only.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_materials TO authenticated;
GRANT SELECT, UPDATE ON public.extracted_questions TO authenticated;
GRANT SELECT ON public.pdf_processing_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.universities, public.faculties, public.departments,
  public.academic_levels, public.semesters, public.resources, public.site_settings TO authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
