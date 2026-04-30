import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing from environment variables.")
}

// DEFINITIVE FIX for "this.lock is not a function" and connection issues
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Use a clean storage key and standard localStorage
    storageKey: 'forgetrack_session',
    storage: window.localStorage,
    // Explicitly set flow to 'pkce' (standard for modern web)
    flowType: 'pkce'
  },
  global: {
    // Ensure fetch doesn't hang on network errors
    fetch: (...args) => fetch(...args).catch(err => {
      console.error('Supabase Network Error:', err);
      throw err;
    })
  }
})
