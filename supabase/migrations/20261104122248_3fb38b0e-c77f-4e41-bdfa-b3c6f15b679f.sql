-- ============================================================
-- StudyAI - core schema (Phase 1/3 foundation)
-- ============================================================

-- ---------- Enums ----------
CREATE TYPE public.app_role AS ENUM ('super_admin', 'student');
CREATE TYPE public.membership_plan AS ENUM ('free', 'explorer', 'premium');
CREATE TYPE public.membership_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
CREATE TYPE public.material_status AS ENUM ('uploaded', 'processing', 'processed', 'failed');
CREATE TYPE public.review_status AS ENUM ('pending_review', 'approved', 'rejected', 'published');
CREATE TYPE public.payment_status AS ENUM ('pending', 'success', 'failed', 'abandoned');

-- ---------- updated_at trigger helper ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ---------- Academic directory ----------
CREATE TABLE public.universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  country TEXT NOT NULL DEFAULT 'Nigeria',
  website TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.faculties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.academic_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.semesters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Roles ----------
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

-- ---------- Profiles ----------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  faculty_id UUID REFERENCES public.faculties(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  academic_level_id UUID REFERENCES public.academic_levels(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
  avatar_url TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- New account: create the matching profile and make them a student.
-- The super administrator role is never granted here.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, university_id, faculty_id, department_id, academic_level_id, semester_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'university_id', '')::uuid,
    NULLIF(NEW.raw_user_meta_data ->> 'faculty_id', '')::uuid,
    NULLIF(NEW.raw_user_meta_data ->> 'department_id', '')::uuid,
    NULLIF(NEW.raw_user_meta_data ->> 'academic_level_id', '')::uuid,
    NULLIF(NEW.raw_user_meta_data ->> 'semester_id', '')::uuid
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- Course library ----------
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculties(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  academic_level_id UUID REFERENCES public.academic_levels(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.course_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  page_count INTEGER NOT NULL DEFAULT 0,
  has_selectable_text BOOLEAN,
  status public.material_status NOT NULL DEFAULT 'uploaded',
  is_published BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A student may read a material only when its course matches their academic profile.
CREATE OR REPLACE FUNCTION public.is_material_authorized(_material_id uuid)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_materials m
    JOIN public.courses c ON c.id = m.course_id
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE m.id = _material_id
      AND m.is_published
      AND c.is_published
      AND (c.university_id IS NULL OR c.university_id = p.university_id)
      AND (c.faculty_id IS NULL OR c.faculty_id = p.faculty_id)
      AND (c.department_id IS NULL OR c.department_id = p.department_id)
      AND (c.academic_level_id IS NULL OR c.academic_level_id = p.academic_level_id)
      AND (c.semester_id IS NULL OR c.semester_id = p.semester_id)
  );
$$;

-- ---------- PDF scanner ----------
CREATE TABLE public.pdf_processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  pages_total INTEGER NOT NULL DEFAULT 0,
  pages_scanned INTEGER NOT NULL DEFAULT 0,
  questions_detected INTEGER NOT NULL DEFAULT 0,
  options_extracted INTEGER NOT NULL DEFAULT 0,
  duplicates_detected INTEGER NOT NULL DEFAULT 0,
  ocr_errors INTEGER NOT NULL DEFAULT 0,
  awaiting_review INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.extracted_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.pdf_processing_jobs(id) ON DELETE SET NULL,
  question_number INTEGER,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option TEXT,
  diagram_path TEXT,
  page_number INTEGER,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  topic TEXT,
  exam_year INTEGER,
  status public.review_status NOT NULL DEFAULT 'pending_review',
  flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Memberships and payments ----------
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan public.membership_plan NOT NULL DEFAULT 'free',
  status public.membership_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  paystack_reference TEXT,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan public.membership_plan NOT NULL,
  amount_naira NUMERIC(12,2) NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  reference TEXT NOT NULL UNIQUE,
  status public.payment_status NOT NULL DEFAULT 'pending',
  provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Reading progress and daily allowance ----------
CREATE TABLE public.reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
  last_page_read INTEGER NOT NULL DEFAULT 0,
  pages_read_total INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, material_id)
);

CREATE TABLE public.reading_daily_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
  pages_read INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date, material_id)
);

-- ---------- AI usage ----------
CREATE TABLE public.ai_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT '',
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Site content ----------
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Guide',
  author TEXT NOT NULL DEFAULT 'FrenyTech',
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cookie_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  essentials BOOLEAN NOT NULL DEFAULT true,
  analytics BOOLEAN NOT NULL DEFAULT false,
  marketing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Indexes ----------
CREATE INDEX idx_faculties_university ON public.faculties(university_id);
CREATE INDEX idx_departments_faculty ON public.departments(faculty_id);
CREATE INDEX idx_courses_lookup ON public.courses(university_id, department_id, academic_level_id, semester_id);
CREATE INDEX idx_materials_course ON public.course_materials(course_id);
CREATE INDEX idx_questions_status ON public.extracted_questions(status);
CREATE INDEX idx_questions_material ON public.extracted_questions(material_id);
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_reading_usage_day ON public.reading_daily_usage(user_id, usage_date);
CREATE INDEX idx_ai_usage_user_day ON public.ai_usage(user_id, created_at);
CREATE INDEX idx_jobs_material ON public.pdf_processing_jobs(material_id);

-- ---------- updated_at triggers ----------
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.universities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.faculties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.academic_levels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.semesters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.course_materials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pdf_processing_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.extracted_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reading_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reading_daily_usage FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cookie_consents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- GRANTS
-- ============================================================
-- Public academic directory (needed before sign-in, at registration)
GRANT SELECT ON public.universities TO anon, authenticated;
GRANT SELECT ON public.faculties TO anon, authenticated;
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT SELECT ON public.academic_levels TO anon, authenticated;
GRANT SELECT ON public.semesters TO anon, authenticated;
GRANT ALL ON public.universities TO service_role;
GRANT ALL ON public.faculties TO service_role;
GRANT ALL ON public.departments TO service_role;
GRANT ALL ON public.academic_levels TO service_role;
GRANT ALL ON public.semesters TO service_role;

-- Roles: read-only for the signed-in user, never writable from the app
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Profiles
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Courses and materials
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT ON public.course_materials TO authenticated;
GRANT ALL ON public.courses TO service_role;
GRANT ALL ON public.course_materials TO service_role;

-- Scanner: administrator surfaces only, served through the server layer
GRANT ALL ON public.pdf_processing_jobs TO service_role;
GRANT ALL ON public.extracted_questions TO service_role;

-- Memberships, payments, reading, AI usage
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.reading_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.reading_daily_usage TO authenticated;
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.reading_progress TO service_role;
GRANT ALL ON public.reading_daily_usage TO service_role;
GRANT ALL ON public.ai_usage TO service_role;

-- Site content
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT INSERT, UPDATE ON public.cookie_consents TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
GRANT ALL ON public.site_settings TO service_role;
GRANT ALL ON public.resources TO service_role;
GRANT ALL ON public.cookie_consents TO service_role;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

-- Academic directory: public read, administrator writes
CREATE POLICY "Anyone can read universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Anyone can read faculties" ON public.faculties FOR SELECT USING (true);
CREATE POLICY "Anyone can read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Anyone can read academic levels" ON public.academic_levels FOR SELECT USING (true);
CREATE POLICY "Anyone can read semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Administrator manages universities" ON public.universities FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Administrator manages faculties" ON public.faculties FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Administrator manages departments" ON public.departments FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Administrator manages academic levels" ON public.academic_levels FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Administrator manages semesters" ON public.semesters FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Roles: own row readable, nothing writable from the app
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Administrator can read all roles" ON public.user_roles FOR SELECT USING (public.is_super_admin());

-- Profiles
CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Administrator can read all profiles" ON public.profiles FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Courses
CREATE POLICY "Signed-in users read published courses" ON public.courses FOR SELECT USING (is_published OR public.is_super_admin());
CREATE POLICY "Administrator manages courses" ON public.courses FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Materials
CREATE POLICY "Students read authorized materials" ON public.course_materials FOR SELECT USING (public.is_super_admin() OR public.is_material_authorized(id));
CREATE POLICY "Administrator manages materials" ON public.course_materials FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Scanner tables: administrator only
CREATE POLICY "Administrator reads processing jobs" ON public.pdf_processing_jobs FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Administrator reads extracted questions" ON public.extracted_questions FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Administrator updates extracted questions" ON public.extracted_questions FOR UPDATE USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Memberships and payments: own rows
CREATE POLICY "Users read their own subscriptions" ON public.subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Administrator reads all subscriptions" ON public.subscriptions FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Users read their own payments" ON public.payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Administrator reads all payments" ON public.payments FOR SELECT USING (public.is_super_admin());

-- Reading: own rows
CREATE POLICY "Users manage their own reading progress" ON public.reading_progress FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Administrator reads all reading progress" ON public.reading_progress FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Users manage their own daily reading usage" ON public.reading_daily_usage FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Administrator reads all daily reading usage" ON public.reading_daily_usage FOR SELECT USING (public.is_super_admin());

-- AI usage: own rows readable
CREATE POLICY "Users read their own AI usage" ON public.ai_usage FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Administrator reads all AI usage" ON public.ai_usage FOR SELECT USING (public.is_super_admin());

-- Contact form: anyone may submit
CREATE POLICY "Anyone can submit a contact message" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Administrator reads contact messages" ON public.contact_messages FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Administrator updates contact messages" ON public.contact_messages FOR UPDATE USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Site settings: public read, administrator writes
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Administrator manages site settings" ON public.site_settings FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Resources: published readable by all
CREATE POLICY "Anyone can read published resources" ON public.resources FOR SELECT USING (published OR public.is_super_admin());
CREATE POLICY "Administrator manages resources" ON public.resources FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Cookie consent: record per session or user
CREATE POLICY "Anyone can save cookie consent" ON public.cookie_consents FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own cookie consent" ON public.cookie_consents FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- Seed: academic levels (100L-500L) and semesters
-- ============================================================
INSERT INTO public.academic_levels (code, name, position) VALUES
  ('100L', '100 Level', 1),
  ('200L', '200 Level', 2),
  ('300L', '300 Level', 3),
  ('400L', '400 Level', 4),
  ('500L', '500 Level', 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.semesters (code, name, position) VALUES
  ('first', 'First Semester', 1),
  ('second', 'Second Semester', 2)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.site_settings (key, value) VALUES
  ('membership', '{"free":{"name":"Free","price":0},"explorer":{"name":"Explorer","price":300},"premium":{"name":"Premium","price":500}}'::jsonb)
ON CONFLICT (key) DO NOTHING;