const { Client } = require('pg');

async function wipeData() {
  const projectRef = 'eoeneizwhhdsnfxbcszm';
  // Attempt with manual encoding of @ to %40
  const connectionString = `postgresql://postgres:13092006%40RAKSHU@db.${projectRef}.supabase.co:5432/postgres`;
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    // Wipe all data tables except students and users
    const tables = ['attendance', 'materials', 'import_log', 'sessions'];
    
    for (const table of tables) {
      console.log(`Wiping ${table}...`);
      await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
      await client.query(`DELETE FROM ${table}`);
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    }
    
    console.log('✅ Success: All seed data cleared.');
    
    await client.end();
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

wipeData();
