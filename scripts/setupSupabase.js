const path = require('path');
const { Client } = require('pg');

// Carga segura de variables de entorno (.env)
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.join(__dirname, '../.env'));
  } catch (e) {}
} else {
  try {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
  } catch (e) {}
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERROR DE SEGURIDAD: Variable DATABASE_URL no encontrada en .env');
  console.error('👉 Configura DATABASE_URL en tu archivo .env local para continuar.');
  process.exit(1);
}

const setupDB = async () => {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    // Create motos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.motos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        image_url TEXT,
        catalog_id TEXT,
        plate TEXT,
        current_odometer INTEGER DEFAULT 0,
        is_from_agency BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log('Table motos created/verified.');

    // Create service_records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.service_records (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        moto_id UUID REFERENCES public.motos(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        odometer INTEGER NOT NULL,
        cost_usd NUMERIC NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log('Table service_records created/verified.');

    // Enable RLS
    await client.query(`ALTER TABLE public.motos ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;`);
    
    // Create Policies
    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Users can view own motos" ON public.motos FOR SELECT USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Users can insert own motos" ON public.motos FOR INSERT WITH CHECK (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Users can update own motos" ON public.motos FOR UPDATE USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Users can delete own motos" ON public.motos FOR DELETE USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Users can view own records" ON public.service_records FOR SELECT USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Users can insert own records" ON public.service_records FOR INSERT WITH CHECK (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Users can update own records" ON public.service_records FOR UPDATE USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE POLICY "Users can delete own records" ON public.service_records FOR DELETE USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    console.log('Row Level Security and Policies configured.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};

setupDB();
