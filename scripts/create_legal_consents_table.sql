-- =====================================================================
-- TABLA DE AUDITORÍA Y TRAZABILIDAD DE CONSENTIMIENTOS LEGALES (GARAGE)
-- Cumplimiento RGPD (Art. 7.1), LOPDGDD y principio de Accountability
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.legal_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    
    -- Consentimiento Términos y Condiciones
    terms_accepted BOOLEAN NOT NULL DEFAULT true,
    terms_version TEXT NOT NULL,
    terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Consentimiento Política de Privacidad y Tratamiento de Datos Sensibles
    privacy_accepted BOOLEAN NOT NULL DEFAULT true,
    privacy_version TEXT NOT NULL,
    privacy_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Política de Cookies y Almacenamiento Local
    cookies_acknowledged BOOLEAN NOT NULL DEFAULT true,
    cookies_version TEXT NOT NULL,
    
    -- Contexto y Método de Obtención del Consentimiento
    acceptance_context TEXT NOT NULL DEFAULT 'auth_registration_screen',
    consent_method TEXT NOT NULL DEFAULT 'explicit_separate_opt_in',
    
    -- Trazabilidad Técnica
    ip_address TEXT,
    device_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsqueda rápida y auditorías regulatorias
CREATE INDEX IF NOT EXISTS idx_legal_consents_email ON public.legal_consents(email);
CREATE INDEX IF NOT EXISTS idx_legal_consents_user_id ON public.legal_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_consents_created_at ON public.legal_consents(created_at);

-- Habilitar Políticas de Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.legal_consents ENABLE ROW LEVEL SECURITY;

-- Política 1: Permitir inserción durante el registro (usuarios autenticados o anónimos en proceso de registro)
CREATE POLICY "Permitir insercion de consentimientos legales"
    ON public.legal_consents
    FOR INSERT
    WITH CHECK (true);

-- Política 2: Los usuarios pueden consultar sus propios consentimientos
CREATE POLICY "Usuarios pueden consultar sus propios consentimientos"
    ON public.legal_consents
    FOR SELECT
    USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = email);

-- Comentario informativo
COMMENT ON TABLE public.legal_consents IS 'Registro inmutable de trazabilidad de consentimientos legales independientes (Términos, Privacidad, Cookies) otorgados por los usuarios de GARAGE.';
