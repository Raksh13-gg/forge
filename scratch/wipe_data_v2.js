const { Client } = require('pg');

async function wipeData() {
  const projectRef = 'eoeneizwhhdsnfxbcszm';
  // Try password WITHOUT brackets
  const pass = encodeURIComponent('13092006@RAKSHU');
  const connectionString = `postgresql://postgres.${projectRef}:${pass}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    console.log('Disabling RLS temporarily...');
    await client.query('ALTER TABLE sessions DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE materials DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE attendance DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE import_log DISABLE ROW LEVEL SECURITY');
    
    console.log('Wiping tables...');
    await client.query('DELETE FROM materials');
    await client.query('DELETE FROM attendance');
    await client.query('DELETE FROM import_log');
    await client.query('DELETE FROM sessions');
    
    console.log('Re-enabling RLS...');
    await client.query('ALTER TABLE sessions ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE materials ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE attendance ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE import_log ENABLE ROW LEVEL SECURITY');
    
    console.log('✅ Success: All seed data cleared.');
    
    await client.end();
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

wipeData();
