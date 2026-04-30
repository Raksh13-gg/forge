-- ForgeTrack Supabase Seed Data

-- 1. Insert Mentors & Test Student into auth.users (simulate via public.users since we can't seed auth.users easily here without API)
-- In a real setup, you would create these users via Supabase auth API first, then map here.
-- For local/mock testing, we will insert them into students and public.users directly (assuming trigger handles or omitting UUIDs)
-- We will use hardcoded mock UUIDs or let them be null safely if constraints allow (but public.users id references auth.users).
-- Actually, seeding `auth.users` directly in Supabase local via seed.sql is possible.
-- For simplicity, we'll insert just our schema tables.

-- Insert 15 Sessions
INSERT INTO public.sessions (date, topic, month_number, duration_hours, session_type)
VALUES
('2026-03-01', '8-Layer AI Stack', 6, 2.0, 'offline'),
('2026-03-03', 'ReAct Agent Pattern', 6, 2.0, 'online'),
('2026-03-05', 'pgvector RAG', 6, 2.0, 'offline'),
('2026-03-08', 'Tiered Autonomy Multi-Agent', 6, 2.0, 'offline'),
('2026-03-10', 'Function Calling with Gemini', 6, 2.0, 'online'),
('2026-03-12', 'Fine-Tuning LLaMA 3', 6, 2.0, 'offline'),
('2026-03-15', 'Prompt Engineering 2.0', 6, 2.0, 'offline'),
('2026-03-17', 'Vector Search Deep Dive', 6, 2.5, 'online'),
('2026-03-19', 'RAG Evaluations', 6, 2.0, 'offline'),
('2026-03-22', 'Building AI Agents', 6, 2.0, 'offline'),
('2026-03-24', 'LangChain vs LlamaIndex', 6, 2.0, 'online'),
('2026-03-26', 'Agentic Workflows', 6, 3.0, 'offline'),
('2026-03-29', 'AI Assistants Architecture', 6, 2.0, 'offline'),
('2026-03-31', 'Deploying to Supabase', 6, 2.0, 'online'),
('2026-04-02', 'Demo Day Prep', 6, 2.0, 'offline')
ON CONFLICT DO NOTHING;

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

-- Insert Materials (2 per session)
INSERT INTO public.materials (session_id, title, type, url)
SELECT id, topic || ' Slides', 'slides', 'https://slides.com/sample'
FROM public.sessions;

INSERT INTO public.materials (session_id, title, type, url)
SELECT id, topic || ' Recording', 'recording', 'https://youtube.com/sample'
FROM public.sessions;

-- Insert Import Logs (2 past entries)
INSERT INTO public.import_log (filename, uploaded_by, total_rows, imported_rows, skipped_rows, status)
VALUES
('month_4_attendance.csv', 'Nischay', 100, 100, 0, 'completed'),
('month_5_attendance.csv', 'Varun', 120, 118, 2, 'completed');

-- NOTE: Attendance inserts (Cartesian product of students x sessions)
-- This query marks ~80% attendance randomly.
INSERT INTO public.attendance (student_id, session_id, present, marked_by)
SELECT st.id, se.id, (random() > 0.2), 'system'
FROM public.students st
CROSS JOIN public.sessions se
ON CONFLICT DO NOTHING;
