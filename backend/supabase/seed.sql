-- ForgeTrack Supabase Seed Data

-- 1. Insert Mentors & Test Student into auth.users (simulate via public.users since we can't seed auth.users easily here without API)
-- In a real setup, you would create these users via Supabase auth API first, then map here.
-- For local/mock testing, we will insert them into students and public.users directly (assuming trigger handles or omitting UUIDs)
-- We will use hardcoded mock UUIDs or let them be null safely if constraints allow (but public.users id references auth.users).
-- Actually, seeding `auth.users` directly in Supabase local via seed.sql is possible.
-- For simplicity, we'll insert just our schema tables.



-- Insert Students (25)
INSERT INTO public.students (name, usn, branch_code)
VALUES
('Aarav Patel', '4SH24CS001', 'CS'),
('Ishita Sharma', '4SH24AI002', 'AI'),
('Vivaan Desai', '4SH24IS003', 'IS'),
('Diya Reddy', '4SH24CS004', 'CS'),
('Rohan Gupta', '4SH24CS005', 'CS'),
('Kavya Singh', '4SH24AI006', 'AI'),
('Aditya Verma', '4SH24IS007', 'IS'),
('Meera Nair', '4SH24CS008', 'CS'),
('Arjun Kumar', '4SH24CS009', 'CS'),
('Sanya Joshi', '4SH24AI010', 'AI'),
('Aryan Rao', '4SH24IS011', 'IS'),
('Priya Menon', '4SH24CS012', 'CS'),
('Rahul K', '4SH24CS013', 'CS'),
('Ananya Pillai', '4SH24AI014', 'AI'),
('Krishna Iyer', '4SH24IS015', 'IS'),
('Neha Bhat', '4SH24CS016', 'CS'),
('Vikram Shenoy', '4SH24CS017', 'CS'),
('Sneha Kamat', '4SH24AI018', 'AI'),
('Rishi Pradhan', '4SH24IS019', 'IS'),
('Tanya M', '4SH24CS020', 'CS'),
('Karthik Shetty', '4SH24CS021', 'CS'),
('Shruti N', '4SH24AI022', 'AI'),
('Siddharth P', '4SH24IS023', 'IS'),
('Anjali V', '4SH24CS024', 'CS'),
('Dev A', '4SH24CS025', 'CS')
ON CONFLICT DO NOTHING;


