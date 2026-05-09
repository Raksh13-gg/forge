const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function wipeData() {
  const env = fs.readFileSync('frontend/.env.local', 'utf8');
  const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
  const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
  const supabase = createClient(url, key);

  console.log('Using Supabase URL:', url);
  
  const tables = ['attendance', 'import_log', 'sessions', 'students'];
  
  for (const table of tables) {
    console.log(`Wiping ${table}...`);
    // Note: This requires RLS to allow deletions, but we use the anon key.
    // If it fails, I will try a different approach.
    const { error } = await supabase.from(table).delete().neq('id', -1);
    if (error) console.error(`Error wiping ${table}:`, error.message);
    else console.log(`✅ ${table} wiped.`);
  }

  console.log('Done.');
}

wipeData();
