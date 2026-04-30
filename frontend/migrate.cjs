const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Using the transaction pooler (port 6543) which supports IPv4
// Using the transaction pooler (port 6543) which supports IPv4
// Direct connection (not IPv4 compatible by default)
const connectionString = 'postgresql://postgres:13092006%40RAKSHU@db.eoeneizwhhdsnfxbcszm.supabase.co:5432/postgres';

// Session Pooler (IPv4 compatible)
// const connectionString = 'postgresql://postgres.eoeneizwhhdsnfxbcszm:13092006%40RAKSHU@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function migrate() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to Supabase...");
    await client.connect();

    // 1. Run Schema
    console.log("Running schema.sql...");
    const schemaPath = path.join(__dirname, '../backend/supabase/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log("Schema applied successfully.");

    // 2. Run Seed
    console.log("Running seed.sql...");
    const seedPath = path.join(__dirname, '../backend/supabase/seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log("Seed data applied successfully.");

    // 3. Create Mentor Account
    console.log("Creating Mentor Account...");
    const mentorSql = `
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, aud, role)
      VALUES (
        gen_random_uuid(),
        'nischay@theboringpeople.in',
        crypt('password123', gen_salt('bf')),
        NOW(),
        '{"role": "mentor", "display_name": "Nischay B K"}'::jsonb,
        'authenticated',
        'authenticated'
      )
      ON CONFLICT (email) DO NOTHING;
    `;
    await client.query(mentorSql);
    console.log("Mentor account created successfully.");

    console.log("All migrations completed!");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
