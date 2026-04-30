-- 1. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Mentors can see all users" ON public.users;
DROP POLICY IF EXISTS "Anyone can see their own profile" ON public.users;
DROP POLICY IF EXISTS "Mentors can manage students" ON public.students;
DROP POLICY IF EXISTS "Students can see themselves" ON public.students;
DROP POLICY IF EXISTS "Mentors can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Mentors can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can see their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Mentors can manage materials" ON public.materials;
DROP POLICY IF EXISTS "Anyone can view materials" ON public.materials;
DROP POLICY IF EXISTS "Mentors can see logs" ON public.import_log;

-- 3. Create NEW robust policies
-- Use both public.users table AND auth.jwt() metadata for "mentor" check

-- SESSIONS
CREATE POLICY "Mentors can manage sessions" ON public.sessions
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor' 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  );
CREATE POLICY "Anyone can view sessions" ON public.sessions
  FOR SELECT USING (true);

-- STUDENTS
CREATE POLICY "Mentors can manage students" ON public.students
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor' 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  );
CREATE POLICY "Students can see themselves" ON public.students
  FOR SELECT USING (
    id = (SELECT student_id FROM public.users WHERE id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'student_id')::uuid = id
  );

-- ATTENDANCE
CREATE POLICY "Mentors can manage attendance" ON public.attendance
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor' 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  );
CREATE POLICY "Students can see their own attendance" ON public.attendance
  FOR SELECT USING (
    student_id = (SELECT student_id FROM public.users WHERE id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'student_id')::uuid = student_id
  );

-- MATERIALS
CREATE POLICY "Mentors can manage materials" ON public.materials
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor' 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  );
CREATE POLICY "Anyone can view materials" ON public.materials
  FOR SELECT USING (true);

-- USERS (Profiles)
CREATE POLICY "Profiles are viewable by owner and mentors" ON public.users
  USING (
    id = auth.uid() 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  );

-- IMPORT LOG
CREATE POLICY "Mentors can manage logs" ON public.import_log
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor' 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  );
