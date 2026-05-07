const { Client } = require('pg');

const connectionString = 'postgresql://postgres:13092006%40RAKSHU@db.eoeneizwhhdsnfxbcszm.supabase.co:5432/postgres';

async function clearSeedData() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to Supabase...");
    await client.connect();

    console.log("Clearing sessions (which will cascade to materials and attendance)...");
    await client.query('DELETE FROM public.sessions;');
    
    console.log("Clearing import_log...");
    await client.query('DELETE FROM public.import_log;');

    console.log("Seed data cleared successfully, user data kept.");
  } catch (err) {
    console.error("Failed to clear data:", err);
  } finally {
    await client.end();
  }
}

clearSeedData();
