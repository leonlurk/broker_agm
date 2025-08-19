-- ====================================
-- SCRIPT DEFINITIVO PARA TU SUPABASE
-- Basado en la estructura real donde profiles es la tabla principal
-- ====================================

-- PARTE 1: Ajustar la tabla profiles
-- ====================================
-- Agregar columnas necesarias a profiles si no existen

-- Agregar photourl para fotos de perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photourl TEXT;

-- Agregar columnas adicionales necesarias para el perfil completo
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ciudad TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS apellido TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phonecode TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phonenumber TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fechanacimiento DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Si no existe el trigger de updated_at para profiles, crearlo
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- El trigger ya existe según vimos (update_profiles_updated_at)
-- pero por si acaso:
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- PARTE 2: Crear tabla payment_methods
-- ====================================
DROP TABLE IF EXISTS payment_methods CASCADE;

CREATE TABLE payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('crypto', 'bank')),
    alias VARCHAR(255) NOT NULL,
    
    -- Campos para crypto
    network VARCHAR(100),
    address TEXT,
    
    -- Campos para banco
    cbu VARCHAR(255),
    holder_name VARCHAR(255),
    holder_id VARCHAR(255),
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint flexible
    CONSTRAINT payment_method_fields_check CHECK (
        (type = 'crypto' AND address IS NOT NULL) OR
        (type = 'bank' AND cbu IS NOT NULL)
    )
);

-- Índices
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_is_active ON payment_methods(is_active);

-- Habilitar RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- PARTE 3: Políticas RLS para profiles (si no existen)
-- ====================================
-- Asegurar que profiles tiene RLS habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay y recrearlas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Opcional: permitir ver perfiles públicos (username, photourl)
-- Comenta esta línea si no quieres que los perfiles sean públicos
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- PARTE 4: Instrucciones para Storage
-- ====================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'CONFIGURACIÓN DE STORAGE';
    RAISE NOTICE '====================================';
    
    IF NOT EXISTS (SELECT FROM storage.buckets WHERE id = 'profile-pictures') THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  ACCIÓN REQUERIDA:';
        RAISE NOTICE '';
        RAISE NOTICE '1. Ve a tu Dashboard de Supabase';
        RAISE NOTICE '2. Click en "Storage" en el menú lateral';
        RAISE NOTICE '3. Click en "New bucket"';
        RAISE NOTICE '4. Configurar:';
        RAISE NOTICE '   - Name: profile-pictures';
        RAISE NOTICE '   - Public bucket: ✅ (activar)';
        RAISE NOTICE '   - File size limit: 5242880 (5MB)';
        RAISE NOTICE '   - Allowed MIME types:';
        RAISE NOTICE '     • image/jpeg';
        RAISE NOTICE '     • image/jpg';
        RAISE NOTICE '     • image/png';
        RAISE NOTICE '     • image/gif';
        RAISE NOTICE '     • image/webp';
        RAISE NOTICE '5. Click en "Save"';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '✅ Bucket profile-pictures ya existe';
    END IF;
END $$;

-- PARTE 5: Verificación Final
-- ====================================
SELECT '====================================';
SELECT 'RESULTADOS DE CONFIGURACIÓN:';
SELECT '====================================';

-- Verificar tabla profiles
SELECT 
    'profiles (columnas agregadas)' as componente,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'photourl'
        ) 
        THEN '✅ photourl agregada' 
        ELSE '❌ Error agregando photourl' 
    END as estado;

-- Verificar payment_methods
SELECT 
    'payment_methods' as componente,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_methods') 
        THEN '✅ Tabla creada' 
        ELSE '❌ Error creando tabla' 
    END as estado;

-- Verificar políticas RLS
SELECT 
    'RLS en payment_methods' as componente,
    COUNT(*) || ' políticas creadas' as estado
FROM pg_policies 
WHERE tablename = 'payment_methods';

-- Verificar bucket
SELECT 
    'Storage bucket' as componente,
    CASE 
        WHEN EXISTS (SELECT FROM storage.buckets WHERE id = 'profile-pictures') 
        THEN '✅ profile-pictures existe' 
        ELSE '⚠️  Crear manualmente (ver instrucciones arriba)' 
    END as estado;

-- Mostrar estructura de profiles actualizada (solo nuevas columnas)
SELECT 
    'Columnas en profiles:' as info;
    
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name IN ('photourl', 'full_name', 'phone', 'country', 'ciudad', 
                       'nombre', 'apellido', 'phonecode', 'phonenumber', 
                       'fechanacimiento', 'gender', 'address')
ORDER BY column_name;