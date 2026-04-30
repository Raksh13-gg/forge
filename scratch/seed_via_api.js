import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'c:/Users/raksh/OneDrive/Desktop/forge track/frontend/.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seed() {
  console.log('Seeding database via API...')

  // 1. Sessions
  const sessions = [
    { date: '2026-03-01', topic: '8-Layer AI Stack', month_number: 6, duration_hours: 2.0, session_type: 'offline' },
    { date: '2026-03-03', topic: 'ReAct Agent Pattern', month_number: 6, duration_hours: 2.0, session_type: 'online' },
    { date: '2026-03-05', topic: 'pgvector RAG', month_number: 6, duration_hours: 2.0, session_type: 'offline' }
  ]

  const { error: sessErr } = await supabase.from('sessions').upsert(sessions, { onConflict: 'date' })
  if (sessErr) console.error('Sessions seed error:', sessErr.message)
  else console.log('Sessions seeded.')

  // 2. Students
  const students = [
    { name: 'Aarav Patel', usn: '4SH24CS001', branch_code: 'CS' },
    { name: 'Ishita Sharma', usn: '4SH24AI002', branch_code: 'AI' },
    { name: 'Vivaan Desai', usn: '4SH24IS003', branch_code: 'IS' },
    { name: 'Diya Reddy', usn: '4SH24CS004', branch_code: 'CS' },
    { name: 'Rohan Gupta', usn: '4SH24CS005', branch_code: 'CS' }
  ]

  const { error: stuErr } = await supabase.from('students').upsert(students, { onConflict: 'usn' })
  if (stuErr) console.error('Students seed error:', stuErr.message)
  else console.log('Students seeded.')

  console.log('Seeding complete!')
}

seed()
