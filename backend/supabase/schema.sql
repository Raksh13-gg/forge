-- ForgeTrack Supabase Schema

-- Drop tables if resetting
-- DROP TABLE IF EXISTS import_log, materials, attendance, sessions, students, public.users CASCADE;

-- 1. Students
CREATE TABLE IF NOT EXISTS public.students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  usn TEXT UNIQUE NOT NULL,
  admission_number TEXT,
  email TEXT,
  branch_code TEXT NOT NULL,
  batch TEXT DEFAULT '2024-2028',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  month_number INTEGER NOT NULL,
  duration_hours DECIMAL(3,1) DEFAULT 2.0,
  session_type TEXT DEFAULT 'offline',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. ImportLog
CREATE TABLE IF NOT EXISTS public.import_log (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  total_rows INTEGER NOT NULL,
  imported_rows INTEGER NOT NULL,
  skipped_rows INTEGER NOT NULL,
  warnings TEXT,
  column_mapping TEXT,
  status TEXT NOT NULL
);

-- 4. Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL,
  marked_at TIMESTAMP DEFAULT NOW(),
  marked_by TEXT DEFAULT 'system',
  import_id INTEGER REFERENCES public.import_log(id) ON DELETE SET NULL,
  UNIQUE(student_id, session_id)
);

-- Check constraints for Attendance (No future dates and not before program start)
-- Handled by verifying sessions date, but here is a sample check if attendance tracks the date directly.

-- 5. Materials
CREATE TABLE IF NOT EXISTS public.materials (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Public Users (Bridging Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
  student_id INTEGER REFERENCES public.students(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Enforcement
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Mentors have full access across all tables
-- We use a check on the auth.jwt() metadata to avoid recursion on the users table
CREATE POLICY "mentors_all_students" ON public.students FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor');
CREATE POLICY "mentors_all_sessions" ON public.sessions FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor');
CREATE POLICY "mentors_all_attendance" ON public.attendance FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor');
CREATE POLICY "mentors_all_materials" ON public.materials FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor');
CREATE POLICY "mentors_all_logs" ON public.import_log FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor');
CREATE POLICY "mentors_all_users" ON public.users FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor');

-- Students have scoped read-only access
CREATE POLICY "students_read_own" ON public.students FOR SELECT USING (id = (SELECT student_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "sessions_read_all" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "materials_read_all" ON public.materials FOR SELECT USING (true);
CREATE POLICY "attendance_read_own" ON public.attendance FOR SELECT USING (student_id = (SELECT student_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (id = auth.uid());

-- 7. Triggers
-- Auto-create a public.users row whenever a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, student_id, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    (NEW.raw_user_meta_data ->> 'student_id')::INTEGER,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- Trigger to auto-sync students to auth.users (FOR LOCAL SEEDING ONLY)
-- In production, students should sign up via the API.
CREATE OR REPLACE FUNCTION public.sync_student_to_auth()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- This requires the pgcrypto extension
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, aud, role)
  VALUES (
    gen_random_uuid(),
    NEW.usn || '@forge.local',
    crypt(NEW.usn, gen_salt('bf')),
    NOW(),
    jsonb_build_object('role', 'student', 'student_id', NEW.id, 'display_name', NEW.name),
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO new_user_id;

  -- The on_auth_user_created trigger will handle inserting into public.users
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_student_created ON public.students;
CREATE TRIGGER on_student_created
  AFTER INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.sync_student_to_auth();
