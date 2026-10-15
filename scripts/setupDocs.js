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
    
    // RLS en tabla documents
    await client.query(`ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;`);
    await client.query(`
      DO $$ BEGIN
        DROP POLICY IF EXISTS "Users can view own docs" ON public.documents;
        DROP POLICY IF EXISTS "Users can insert own docs" ON public.documents;
        DROP POLICY IF EXISTS "Users can update own docs" ON public.documents;
        DROP POLICY IF EXISTS "Users can delete own docs" ON public.documents;

        CREATE POLICY "Users can view own docs" ON public.documents FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own docs" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own docs" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own docs" ON public.documents FOR DELETE USING (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Storage bucket para documentos sensibles
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('documents', 'documents', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Políticas RLS blindadas para Storage de Documentos
    // Las rutas de los documentos se guardan bajo {user_id}/{filename}
    await client.query(`
      DO $$ BEGIN
        DROP POLICY IF EXISTS "Docs are publicly accessible" ON storage.objects;
        DROP POLICY IF EXISTS "Anyone can upload docs" ON storage.objects;
        DROP POLICY IF EXISTS "Anyone can delete docs" ON storage.objects;
        DROP POLICY IF EXISTS "Users can view own docs storage" ON storage.objects;
        DROP POLICY IF EXISTS "Users can upload own docs storage" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update own docs storage" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete own docs storage" ON storage.objects;

        -- 1. Acceso de lectura: solo el dueño de la carpeta puede ver sus documentos
        CREATE POLICY "Users can view own docs storage" 
          ON storage.objects FOR SELECT 
          USING ( 
            bucket_id = 'documents' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );

        -- 2. Inserción: solo el dueño autenticado en su propia carpeta
        CREATE POLICY "Users can upload own docs storage" 
          ON storage.objects FOR INSERT 
          WITH CHECK ( 
            bucket_id = 'documents' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );

        -- 3. Actualización: solo el dueño autenticado
        CREATE POLICY "Users can update own docs storage" 
          ON storage.objects FOR UPDATE 
          USING ( 
            bucket_id = 'documents' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );

        -- 4. Eliminación: solo el dueño autenticado
        CREATE POLICY "Users can delete own docs storage" 
          ON storage.objects FOR DELETE 
          USING ( 
            bucket_id = 'documents' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    console.log('Docs table y Storage con políticas RLS reforzadas configurados.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};

setupDocs();
