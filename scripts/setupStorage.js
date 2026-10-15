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

    // Enable RLS and create secure policies
    // Las carpetas en storage siguen la convención {user_id}/{filename}
    await client.query(`
      DO $$ BEGIN
        DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
        DROP POLICY IF EXISTS "Anyone can update an avatar" ON storage.objects;
        DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
        DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

        -- 1. Visualización pública de avatares
        CREATE POLICY "Avatar images are publicly accessible" 
          ON storage.objects FOR SELECT 
          USING ( bucket_id = 'avatars' );

        -- 2. Inserción restringida únicamente al usuario propietario de la carpeta
        CREATE POLICY "Users can upload their own avatar" 
          ON storage.objects FOR INSERT 
          WITH CHECK ( 
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );

        -- 3. Actualización restringida únicamente al usuario propietario
        CREATE POLICY "Users can update their own avatar" 
          ON storage.objects FOR UPDATE 
          USING ( 
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );

        -- 4. Eliminación restringida únicamente al usuario propietario
        CREATE POLICY "Users can delete their own avatar" 
          ON storage.objects FOR DELETE 
          USING ( 
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    
    console.log('Políticas de seguridad reforzadas para Storage (Avatars) aplicadas.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};

setupStorage();
