-- ===================================================
-- ForgeTrack RLS FIX
-- Run this in Supabase Dashboard → SQL Editor
-- ===================================================

-- Drop existing restrictive mentor policies
DROP POLICY IF EXISTS "mentors_all_students" ON public.students;
DROP POLICY IF EXISTS "mentors_all_sessions" ON public.sessions;
DROP POLICY IF EXISTS "mentors_all_attendance" ON public.attendance;
DROP POLICY IF EXISTS "mentors_all_materials" ON public.materials;
DROP POLICY IF EXISTS "mentors_all_logs" ON public.import_log;
DROP POLICY IF EXISTS "mentors_all_users" ON public.users;

-- Re-create policies checking BOTH user_metadata and app_metadata
-- This fixes the "data not loading" issue caused by role being in different JWT paths

CREATE POLICY "mentors_all_students" ON public.students FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'mentor'
);

CREATE POLICY "mentors_all_sessions" ON public.sessions FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'mentor'
);

CREATE POLICY "mentors_all_attendance" ON public.attendance FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'mentor'
);

CREATE POLICY "mentors_all_materials" ON public.materials FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'mentor'
);

CREATE POLICY "mentors_all_logs" ON public.import_log FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'mentor'
);

CREATE POLICY "mentors_all_users" ON public.users FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'mentor'
  OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'mentor'
  OR
  id = auth.uid()  -- Allow users to always read their own row
);

-- Verify the current JWT role for debugging (run separately):
-- SELECT auth.jwt() -> 'user_metadata' ->> 'role' as user_meta_role,
--        auth.jwt() -> 'app_metadata' ->> 'role' as app_meta_role;
