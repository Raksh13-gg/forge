const { Client } = require('pg');

async function checkCounts() {
  const projectRef = 'eoeneizwhhdsnfxbcszm';
  const passWithBrackets = encodeURIComponent('[13092006@RAKSHU]');
  const connectionString = `postgresql://postgres.${projectRef}:${passWithBrackets}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    const studentsRes = await client.query('SELECT count(*) FROM students');
    const sessionsRes = await client.query('SELECT count(*) FROM sessions');
    const attendanceRes = await client.query('SELECT count(*) FROM attendance');
    
    console.log(`Students: ${studentsRes.rows[0].count}`);
    console.log(`Sessions: ${sessionsRes.rows[0].count}`);
    console.log(`Attendance: ${attendanceRes.rows[0].count}`);
    
    await client.end();
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

checkCounts();
