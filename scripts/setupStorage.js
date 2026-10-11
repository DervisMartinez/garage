const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ayydkesfvsisemdrxnlt:XTGLSZ2udbu23WtV@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const setupStorage = async () => {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    // Create bucket
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('avatars', 'avatars', true)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Bucket avatars created/verified.');

    // Enable RLS and create policies
    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Anyone can update an avatar" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    
    console.log('Storage Policies configured.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};

setupStorage();
