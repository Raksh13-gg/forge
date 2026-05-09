const { Client } = require('pg');

async function wipeData() {
  const projectRef = 'eoeneizwhhdsnfxbcszm';
  const passWithBrackets = encodeURIComponent('[13092006@RAKSHU]');
  // Try direct connection instead of pooler
  const connectionString = `postgresql://postgres:${passWithBrackets}@db.${projectRef}.supabase.co:5432/postgres`;
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    console.log('Wiping materials...');
    await client.query('DELETE FROM materials');
    
    console.log('Wiping attendance...');
    await client.query('DELETE FROM attendance');
    
    console.log('Wiping import_log...');
    await client.query('DELETE FROM import_log');
    
    console.log('Wiping sessions...');
    await client.query('DELETE FROM sessions');
    
    console.log('✅ All seed sessions and materials have been cleared.');
    console.log('Students (login credentials) have been preserved.');
    
    await client.end();
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

wipeData();
