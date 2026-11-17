CREATE POLICY "Server manages tutor pages" ON public.tutor_pdf_pages FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE POLICY "Server manages tutor requests" ON public.tutor_requests FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE POLICY "Server manages tutor exams" ON public.tutor_exams FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE INDEX tutor_requests_user_feature ON public.tutor_requests(user_id,feature,created_at);
CREATE INDEX tutor_exams_user ON public.tutor_exams(user_id);
CREATE INDEX tutor_exams_course ON public.tutor_exams(course_id);