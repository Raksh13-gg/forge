const { Client } = require('pg');

async function wipeData() {
  const projectRef = 'eoeneizwhhdsnfxbcszm';
  const connectionString = `postgresql://postgres:13092006%40RAKSHU@db.${projectRef}.supabase.co:5432/postgres`;
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    // Wipe EVERYTHING including students to fix USN corruption
    const tables = ['attendance', 'materials', 'import_log', 'sessions', 'students'];
    
    // Reverse order to handle potential FKs (attendance first, students last)
    for (const table of tables) {
      console.log(`Wiping ${table}...`);
      await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
      await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    }
    
    console.log('✅ Success: All data (including corrupted students) cleared.');
    console.log('Now go to AI Bulk Import and upload the Excel again. It will rebuild everyone correctly.');
    
    await client.end();
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

wipeData();
