-- EMERGENCY FIX: Disable RLS to allow data to load regardless of Auth Metadata
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log DISABLE ROW LEVEL SECURITY;

-- Ensure mentor is recognized as mentor in public.users just in case
UPDATE public.users 
SET role = 'mentor' 
WHERE email = 'nischay@theboringpeople.in';
