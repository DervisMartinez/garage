const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ayydkesfvsisemdrxnlt:XTGLSZ2udbu23WtV@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const setupDocs = async () => {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.documents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        moto_id UUID REFERENCES public.motos(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    
    // RLS
    await client.query(`ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;`);
    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Users can view own docs" ON public.documents FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own docs" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can delete own docs" ON public.documents FOR DELETE USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Storage bucket
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('documents', 'documents', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Docs are publicly accessible" ON storage.objects FOR SELECT USING ( bucket_id = 'documents' );
        CREATE POLICY "Anyone can upload docs" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'documents' );
        CREATE POLICY "Anyone can delete docs" ON storage.objects FOR DELETE USING ( bucket_id = 'documents' );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    console.log('Docs table and storage configured.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};

setupDocs();
