CREATE TABLE public.tutor_pdf_pages (material_id uuid REFERENCES public.course_materials(id) ON DELETE CASCADE NOT NULL, page_number integer NOT NULL CHECK(page_number>0), content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(material_id,page_number));
GRANT ALL ON public.tutor_pdf_pages TO service_role;
ALTER TABLE public.tutor_pdf_pages ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.tutor_requests (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, feature text NOT NULL CHECK(feature IN ('tutor','cbt')), status text NOT NULL DEFAULT 'running' CHECK(status IN ('running','complete')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tutor_requests TO service_role;
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.tutor_exams (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE, questions jsonb NOT NULL, answers jsonb, result jsonb, practice boolean NOT NULL DEFAULT false, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tutor_exams TO service_role;
ALTER TABLE public.tutor_exams ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.reserve_tutor_request(_id uuid,_user_id uuid,_feature text,_limit integer) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE used integer;
BEGIN
PERFORM pg_advisory_xact_lock(hashtext(_user_id::text || _feature));
DELETE FROM public.tutor_requests WHERE user_id=_user_id AND status='running' AND created_at < now()-interval '10 minutes';
IF EXISTS(SELECT 1 FROM public.tutor_requests WHERE id=_id) THEN RETURN 'duplicate'; END IF;
IF _feature='tutor' THEN
SELECT count(*) INTO used FROM public.ai_usage WHERE user_id=_user_id AND feature='tutor' AND created_at >= date_trunc('day',now() AT TIME ZONE 'Africa/Lagos') AT TIME ZONE 'Africa/Lagos';
SELECT used+count(*) INTO used FROM public.tutor_requests WHERE user_id=_user_id AND feature='tutor' AND status='running';
ELSE
SELECT count(*) INTO used FROM public.tutor_requests WHERE user_id=_user_id AND feature='cbt' AND created_at >= date_trunc('day',now() AT TIME ZONE 'Africa/Lagos') AT TIME ZONE 'Africa/Lagos';
END IF;
IF _limit IS NOT NULL AND used>=_limit THEN RETURN 'limit'; END IF;
INSERT INTO public.tutor_requests(id,user_id,feature) VALUES(_id,_user_id,_feature);
RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.reserve_tutor_request(uuid,uuid,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_tutor_request(uuid,uuid,text,integer) TO service_role;
CREATE FUNCTION public.tutor_touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.tutor_touch_updated_at() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tutor_pdf_pages_updated BEFORE UPDATE ON public.tutor_pdf_pages FOR EACH ROW EXECUTE FUNCTION public.tutor_touch_updated_at();
CREATE TRIGGER tutor_requests_updated BEFORE UPDATE ON public.tutor_requests FOR EACH ROW EXECUTE FUNCTION public.tutor_touch_updated_at();
CREATE TRIGGER tutor_exams_updated BEFORE UPDATE ON public.tutor_exams FOR EACH ROW EXECUTE FUNCTION public.tutor_touch_updated_at();