# 🛡️ ForgeTrack - Advanced Attendance Tracker

ForgeTrack is a professional-grade attendance management system designed for mentors to track student progress and for students to monitor their own attendance records. It features a modern UI, role-based authentication, and AI-powered bulk attendance importing.

## 🚀 Live Demo
- **Frontend:** [https://forge-track.vercel.app](https://forge-track.vercel.app)
- **Backend:** Powered by Supabase

## ✨ Features

### 👨‍🏫 For Mentors
- **Dashboard Stats:** Overview of total students, sessions, and average attendance.
- **Bulk Import:** Upload CSV/Excel attendance sheets. 
- **AI-Powered Mapping:** Automatically detects USN, Name, and Date columns using Gemini AI.
- **Manual Session Tracking:** Create and manage sessions with topics and materials.
- **Attendance Management:** View and edit attendance records per session.

### 🎓 For Students
- **Personal Dashboard:** View overall attendance percentage.
- **Detailed History:** Track attendance across all sessions with topic details.
- **Access Materials:** Quickly access links to materials shared during sessions.

### 🛠️ Core Technology
- **Frontend:** React + Vite, Tailwind CSS, Lucide Icons.
- **Backend:** Supabase (Database, Auth, Edge Functions).
- **AI Logic:** Google Gemini AI (for intelligent schema inference).
- **Security:** Strict Row Level Security (RLS) policies ensuring data privacy.

---

## 🛠️ Setup Instructions

### 1. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Backend (Supabase) Setup
1. **Database Schema:** Execute the SQL in `backend/supabase/schema.sql` in your Supabase SQL Editor.
2. **RLS Policies:** Ensure the policies in `schema.sql` (or `rls_fix.sql`) are applied to secure your data.
3. **Seed Data:** (Optional) Run `backend/supabase/seed.sql` to populate initial student records.
4. **Edge Functions:** 
   - Install Supabase CLI.
   - Deploy the functions:
     ```bash
     supabase functions deploy parse-attendance
     ```
   - Set the Gemini API key in Supabase secrets:
     ```bash
     supabase secrets set GEMINI_API_KEY=your_gemini_api_key
     ```

---

## 📊 Database Schema

The database is structured to handle students, sessions, and attendance with high integrity:

- **`students`**: Stores student details (USN, name, branch).
- **`sessions`**: Tracks each session's date, topic, and type.
- **`attendance`**: Junction table linking students to sessions with `present` status.
- **`materials`**: Links educational resources to specific sessions.
- **`users`**: Bridge table linking Supabase Auth users to student profiles.
- **`import_log`**: Audit trail for bulk attendance imports.

---

## 🔑 Authentication
The system uses Supabase Auth with custom `role` metadata:
- **Mentors:** Full read/write access.
- **Students:** Read-only access to their own data and session details.

---

## 📝 License
MIT License
