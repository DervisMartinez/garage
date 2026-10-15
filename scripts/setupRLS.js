const path = require('path');
const { Client } = require('pg');

// Carga de variables de entorno (.env)
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
  console.error('❌ ERROR: Variable DATABASE_URL no encontrada en .env');
  process.exit(1);
}

const setupRLS = async () => {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Supabase PostgreSQL');

    // =========================================================================
    // 1. TABLA: public.legal_consents (Auditoría RGPD / Consentimientos)
    // =========================================================================
    console.log('🔧 Verificando y configurando tabla legal_consents...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.legal_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        email TEXT NOT NULL,
        terms_accepted BOOLEAN NOT NULL DEFAULT true,
        terms_version TEXT NOT NULL,
        terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        privacy_accepted BOOLEAN NOT NULL DEFAULT true,
        privacy_version TEXT NOT NULL,
        privacy_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        cookies_acknowledged BOOLEAN NOT NULL DEFAULT true,
        cookies_version TEXT NOT NULL,
        acceptance_context TEXT NOT NULL DEFAULT 'auth_registration_screen',
        consent_method TEXT NOT NULL DEFAULT 'explicit_separate_opt_in',
        ip_address TEXT,
        device_info JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_legal_consents_email ON public.legal_consents(email);
      CREATE INDEX IF NOT EXISTS idx_legal_consents_user_id ON public.legal_consents(user_id);
      CREATE INDEX IF NOT EXISTS idx_legal_consents_created_at ON public.legal_consents(created_at);
    `);

    // =========================================================================
    // 2. ACTIVAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS PÚBLICAS
    // =========================================================================
    console.log('🔒 Habilitando RLS estricto en tablas públicas...');
    await client.query(`
      ALTER TABLE public.motos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.legal_consents ENABLE ROW LEVEL SECURITY;
    `);

    // =========================================================================
    // 3. POLÍTICAS RLS: public.motos
    // =========================================================================
    console.log('🛡️ Configurando políticas RLS para public.motos...');
    await client.query(`
      DO $$ BEGIN
        -- Limpiar políticas previas
        DROP POLICY IF EXISTS "Users can view own motos" ON public.motos;
        DROP POLICY IF EXISTS "Users can insert own motos" ON public.motos;
        DROP POLICY IF EXISTS "Users can update own motos" ON public.motos;
        DROP POLICY IF EXISTS "Users can delete own motos" ON public.motos;

        -- SELECT: Solo ver motos propias
        CREATE POLICY "Users can view own motos" 
          ON public.motos FOR SELECT 
          USING (auth.uid() = user_id);

        -- INSERT: Solo insertar con su propio user_id
        CREATE POLICY "Users can insert own motos" 
          ON public.motos FOR INSERT 
          WITH CHECK (auth.uid() = user_id);

        -- UPDATE: Solo actualizar motos propias Y validar que user_id no sea alterado (WITH CHECK)
        CREATE POLICY "Users can update own motos" 
          ON public.motos FOR UPDATE 
          USING (auth.uid() = user_id) 
          WITH CHECK (auth.uid() = user_id);

        -- DELETE: Solo eliminar motos propias
        CREATE POLICY "Users can delete own motos" 
          ON public.motos FOR DELETE 
          USING (auth.uid() = user_id);
      END $$;
    `);

    // =========================================================================
    // 4. POLÍTICAS RLS: public.service_records
    // =========================================================================
    console.log('🛡️ Configurando políticas RLS para public.service_records...');
    await client.query(`
      DO $$ BEGIN
        DROP POLICY IF EXISTS "Users can view own records" ON public.service_records;
        DROP POLICY IF EXISTS "Users can insert own records" ON public.service_records;
        DROP POLICY IF EXISTS "Users can update own records" ON public.service_records;
        DROP POLICY IF EXISTS "Users can delete own records" ON public.service_records;

        CREATE POLICY "Users can view own records" 
          ON public.service_records FOR SELECT 
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own records" 
          ON public.service_records FOR INSERT 
          WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own records" 
          ON public.service_records FOR UPDATE 
          USING (auth.uid() = user_id) 
          WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete own records" 
          ON public.service_records FOR DELETE 
          USING (auth.uid() = user_id);
      END $$;
    `);

    // =========================================================================
    // 5. POLÍTICAS RLS: public.documents (Billetera digital y documentos)
    // =========================================================================
    console.log('🛡️ Configurando políticas RLS para public.documents...');
    await client.query(`
      DO $$ BEGIN
        DROP POLICY IF EXISTS "Users can view own docs" ON public.documents;
        DROP POLICY IF EXISTS "Users can insert own docs" ON public.documents;
        DROP POLICY IF EXISTS "Users can update own docs" ON public.documents;
        DROP POLICY IF EXISTS "Users can delete own docs" ON public.documents;

        CREATE POLICY "Users can view own docs" 
          ON public.documents FOR SELECT 
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own docs" 
          ON public.documents FOR INSERT 
          WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own docs" 
          ON public.documents FOR UPDATE 
          USING (auth.uid() = user_id) 
          WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete own docs" 
          ON public.documents FOR DELETE 
          USING (auth.uid() = user_id);
      END $$;
    `);

    // =========================================================================
    // 6. POLÍTICAS RLS: public.legal_consents (Inmutable / Auditoría)
    // =========================================================================
    console.log('🛡️ Configurando políticas RLS inmutables para public.legal_consents...');
    await client.query(`
      DO $$ BEGIN
        DROP POLICY IF EXISTS "Permitir insercion de consentimientos legales" ON public.legal_consents;
        DROP POLICY IF EXISTS "Usuarios pueden consultar sus propios consentimientos" ON public.legal_consents;
        DROP POLICY IF EXISTS "Allow inserting legal consents" ON public.legal_consents;
        DROP POLICY IF EXISTS "Users can view own consents" ON public.legal_consents;

        -- INSERT: Permitido para registrar consentimiento durante registro
        CREATE POLICY "Allow inserting legal consents" 
          ON public.legal_consents FOR INSERT 
          WITH CHECK (true);

        -- SELECT: Solo el usuario o por correo del token JWT puede ver sus consentimientos
        CREATE POLICY "Users can view own consents" 
          ON public.legal_consents FOR SELECT 
          USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

        -- NOTA: NO SE CREAN POLÍTICAS DE UPDATE NI DELETE.
        -- Al no existir políticas de UPDATE ni DELETE bajo RLS, 
        -- ningún usuario cliente puede modificar o borrar registros de auditoría (INMUTABILIDAD).
      END $$;
    `);

    // =========================================================================
    // 7. POLÍTICAS RLS: storage.objects (Avatars y Documents)
    // =========================================================================
    console.log('🛡️ Reforzando políticas RLS en storage.objects...');
    await client.query(`
      DO $$ BEGIN
        -- Avatars
        DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
        DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

        CREATE POLICY "Avatar images are publicly accessible" 
          ON storage.objects FOR SELECT 
          USING ( bucket_id = 'avatars' );

        CREATE POLICY "Users can upload their own avatar" 
          ON storage.objects FOR INSERT 
          WITH CHECK ( 
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );

        CREATE POLICY "Users can update their own avatar" 
          ON storage.objects FOR UPDATE 
          USING ( 
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );

        CREATE POLICY "Users can delete their own avatar" 
          ON storage.objects FOR DELETE 
          USING ( 
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );

        -- Documents
        DROP POLICY IF EXISTS "Users can view own docs storage" ON storage.objects;
        DROP POLICY IF EXISTS "Users can upload own docs storage" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update own docs storage" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete own docs storage" ON storage.objects;

        CREATE POLICY "Users can view own docs storage" 
          ON storage.objects FOR SELECT 
          USING ( 
            bucket_id = 'documents' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );

        CREATE POLICY "Users can upload own docs storage" 
          ON storage.objects FOR INSERT 
          WITH CHECK ( 
            bucket_id = 'documents' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );

        CREATE POLICY "Users can update own docs storage" 
          ON storage.objects FOR UPDATE 
          USING ( 
            bucket_id = 'documents' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );

        CREATE POLICY "Users can delete own docs storage" 
          ON storage.objects FOR DELETE 
          USING ( 
            bucket_id = 'documents' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text 
          );
      END $$;
    `);

    console.log('✨ ¡Todas las políticas RLS de Supabase han sido aplicadas y blindadas exitosamente!');

  } catch (err) {
    console.error('❌ Error aplicando políticas RLS:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
};

setupRLS();
