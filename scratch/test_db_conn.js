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
    const res = await client.query('SELECT NOW()');
    console.log(`Time: ${res.rows[0].now}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`FAILED: ${label} - ${err.message}`);
    return false;
  }
}

async function run() {
  const projectRef = 'eoeneizwhhdsnfxbcszm';
  // Attempt with brackets
  const passWithBrackets = encodeURIComponent('[13092006@RAKSHU]');
  
  await test(`postgresql://postgres.${projectRef}:${passWithBrackets}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`, 'Pooler with brackets in password');
}

run();
