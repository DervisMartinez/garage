const path = require('path');
const { Client } = require('pg');

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(path.join(__dirname, '../.env')); } catch (e) {}
} else {
  try { require('dotenv').config({ path: path.join(__dirname, '../.env') }); } catch (e) {}
}

const connectionString = process.env.DATABASE_URL;

async function check() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  const tables = await client.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public';
  `);
  console.log('=== TABLES & RLS STATUS (schema: public) ===');
  console.table(tables.rows);

  const policies = await client.query(`
    SELECT schemaname, tablename, policyname, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname IN ('public', 'storage')
    ORDER BY schemaname, tablename, policyname;
  `);
  console.log('=== CURRENT ACTIVE POLICIES ===');
  for (const p of policies.rows) {
    console.log(`[${p.schemaname}.${p.tablename}] (${p.cmd}) "${p.policyname}"`);
    console.log(`   USING: ${p.qual}`);
    console.log(`   WITH CHECK: ${p.with_check}`);
  }

  await client.end();
}

check().catch(console.error);
