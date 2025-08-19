-- ====================================
-- CONFIGURACIÓN DE KYC EN SUPABASE
-- ====================================

-- PARTE 1: Crear tabla kyc_verifications si no existe
-- ====================================
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
    
    -- Documentos
    selfie_url TEXT,
    front_document_url TEXT,
    back_document_url TEXT,
    address_proof_url TEXT,
    
    -- Información personal
    full_name VARCHAR(255),
    date_of_birth DATE,
    document_type VARCHAR(50),
    document_number VARCHAR(100),
    country VARCHAR(100),
    address TEXT,
    
    -- Metadata
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(status);

-- Habilitar RLS
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para kyc_verifications
DROP POLICY IF EXISTS "Users can view own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can insert own KYC" ON kyc_verifications;
DROP POLICY IF EXISTS "Users can update own KYC" ON kyc_verifications;

CREATE POLICY "Users can view own KYC" ON kyc_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own KYC" ON kyc_verifications
    FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending', 'rejected'));

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_kyc_verifications_updated_at ON kyc_verifications;
CREATE TRIGGER update_kyc_verifications_updated_at 
    BEFORE UPDATE ON kyc_verifications
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- PARTE 2: Verificar usuarios para KYC status
-- ====================================
-- Agregar columnas KYC al perfil si no existen
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'not_started';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_level INTEGER DEFAULT 0;

-- PARTE 3: Instrucciones para Storage
-- ====================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'CONFIGURACIÓN DE STORAGE PARA KYC';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  DEBES CREAR EL BUCKET MANUALMENTE:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Ve a Supabase Dashboard → Storage';
    RAISE NOTICE '2. Click en "New bucket"';
    RAISE NOTICE '3. Configurar:';
    RAISE NOTICE '   - Name: kyc-documents';
    RAISE NOTICE '   - Public bucket: ❌ NO (privado)';
    RAISE NOTICE '   - File size limit: 10485760 (10MB)';
    RAISE NOTICE '   - Allowed MIME types:';
    RAISE NOTICE '     • image/jpeg';
    RAISE NOTICE '     • image/jpg';
    RAISE NOTICE '     • image/png';
    RAISE NOTICE '     • image/pdf';
    RAISE NOTICE '     • application/pdf';
    RAISE NOTICE '4. Click en "Create bucket"';
    RAISE NOTICE '';
    RAISE NOTICE '5. Después de crear, configurar políticas:';
    RAISE NOTICE '   - Los usuarios pueden subir a su carpeta';
    RAISE NOTICE '   - Los usuarios pueden ver sus propios documentos';
    RAISE NOTICE '   - Los admins pueden ver todos los documentos';
END $$;

-- PARTE 4: Verificación
-- ====================================
SELECT 'VERIFICACIÓN DE CONFIGURACIÓN KYC:' as info;

-- Verificar tabla kyc_verifications
SELECT 
    'kyc_verifications' as componente,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kyc_verifications') 
        THEN '✅ Tabla creada' 
        ELSE '❌ Error creando tabla' 
    END as estado;

-- Verificar columnas KYC en profiles
SELECT 
    'KYC columns in profiles' as componente,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'kyc_status'
        ) 
        THEN '✅ Columnas agregadas' 
        ELSE '❌ Error agregando columnas' 
    END as estado;

-- Mostrar estructura de kyc_verifications
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'kyc_verifications'
ORDER BY ordinal_position;