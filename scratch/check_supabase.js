import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: 'c:/Users/raksh/OneDrive/Desktop/forge track/frontend/.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('Testing Supabase connection...')
  const { data, error } = await supabase.from('students').select('count', { count: 'exact' })
  if (error) {
    console.error('Error fetching students:', error)
  } else {
    console.log('Students count:', data)
  }

  console.log('Testing signup...')
  const email = `test_${Date.now()}@example.com`
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123',
  })
  
  if (authError) {
    console.error('Signup error:', authError)
  } else {
    console.log('Signup success:', authData.user?.id)
  }
}

test()
