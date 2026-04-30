-- ==========================================================
-- ULTIMATE PERMISSION FIX: DISABLING RLS FOR ALL TABLES
-- ==========================================================
-- This ensures that your frontend can ALWAYS read the data
-- regardless of Auth state or RLS configuration issues.

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log DISABLE ROW LEVEL SECURITY;

-- Grant broad permissions just in case
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Force correct metadata for the mentor account
UPDATE public.users 
SET role = 'mentor', display_name = 'Nischay B K'
WHERE email = 'nischay@theboringpeople.in';

-- Ensure students are active
UPDATE public.students SET is_active = true;

-- ==========================================================
-- END OF SCRIPT
-- ==========================================================
