const { Client } = require('pg');

async function test(connectionString, label) {
  console.log(`Testing ${label}...`);
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`SUCCESS: ${label}`);
    const res = await client.query('SELECT count(*) FROM sessions');
    console.log(`Sessions: ${res.rows[0].count}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`FAILED: ${label} - ${err.message}`);
    return false;
  }
}

async function run() {
  const projectRef = 'eoeneizwhhdsnfxbcszm';
  
  // Try with brackets (encoded)
  const passWithBrackets = encodeURIComponent('[13092006@RAKSHU]');
  await test(`postgresql://postgres.${projectRef}:${passWithBrackets}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`, 'Pooler with brackets');

  // Try without brackets (encoded @)
  const passSimple = '13092006%40RAKSHU';
  await test(`postgresql://postgres.${projectRef}:${passSimple}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`, 'Pooler simple');

  // Try without project prefix in user
  await test(`postgresql://postgres:${passSimple}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`, 'Pooler no prefix');
}

run();
