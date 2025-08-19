-- ====================================
-- SCRIPT FINAL PARA TU SUPABASE
-- ====================================

-- PARTE 1: Verificar y ajustar la tabla profiles
-- ====================================
DO $$ 
BEGIN
    -- Verificar si la tabla profiles existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE 'Tabla profiles encontrada';
        
        -- Agregar columna photourl si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'profiles' 
                      AND column_name = 'photourl') THEN
            ALTER TABLE profiles ADD COLUMN photourl TEXT;
            RAISE NOTICE 'Columna photourl agregada a profiles';
        ELSE
            RAISE NOTICE 'Columna photourl ya existe en profiles';
        END IF;
    ELSE
        RAISE NOTICE 'ADVERTENCIA: Tabla profiles no encontrada';
    END IF;
END $$;

-- PARTE 2: Crear tabla payment_methods si no existe
-- ====================================
CREATE TABLE IF NOT EXISTS payment_methods (
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

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);

-- Habilitar RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment methods" ON payment_methods;

-- Crear políticas RLS
CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Crear trigger para updated_at si no existe
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- PARTE 3: Configurar Storage Bucket
-- ====================================
-- Nota: Los buckets deben crearse manualmente en el Dashboard
-- Este código solo verifica si existe

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM storage.buckets WHERE id = 'profile-pictures') THEN
        RAISE NOTICE 'Bucket profile-pictures ya existe';
        
        -- Intentar crear políticas si el bucket existe
        -- Eliminar políticas existentes
        DELETE FROM storage.policies WHERE bucket_id = 'profile-pictures';
        
        -- Crear nuevas políticas
        INSERT INTO storage.policies (bucket_id, name, definition, check_expression, using_expression)
        VALUES 
            ('profile-pictures', 'Allow authenticated uploads', 
             'FOR INSERT', 
             '(auth.uid()::text = (storage.foldername(name))[1])',
             NULL),
            ('profile-pictures', 'Allow public viewing', 
             'FOR SELECT', 
             NULL,
             'true'),
            ('profile-pictures', 'Allow users to update own', 
             'FOR UPDATE', 
             NULL,
             '(auth.uid()::text = (storage.foldername(name))[1])'),
            ('profile-pictures', 'Allow users to delete own', 
             'FOR DELETE', 
             NULL,
             '(auth.uid()::text = (storage.foldername(name))[1])')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Políticas de storage configuradas';
    ELSE
        RAISE NOTICE '⚠️ IMPORTANTE: Debes crear el bucket profile-pictures manualmente:';
        RAISE NOTICE '1. Ve a Storage en el Dashboard de Supabase';
        RAISE NOTICE '2. Click en "New bucket"';
        RAISE NOTICE '3. Name: profile-pictures';
        RAISE NOTICE '4. Public: ✓ (activar)';
        RAISE NOTICE '5. File size limit: 5MB';
    END IF;
END $$;

-- PARTE 4: Verificación Final
-- ====================================
SELECT 'VERIFICACIÓN DE CONFIGURACIÓN:' as info;

-- Verificar payment_methods
SELECT 
    'payment_methods' as componente,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_methods') 
        THEN '✅ CREADA' 
        ELSE '❌ ERROR' 
    END as estado;

-- Verificar columna photourl en profiles
SELECT 
    'photourl en profiles' as componente,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'photourl'
        ) 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado;

-- Verificar bucket
SELECT 
    'profile-pictures bucket' as componente,
    CASE 
        WHEN EXISTS (SELECT FROM storage.buckets WHERE id = 'profile-pictures') 
        THEN '✅ EXISTE' 
        ELSE '⚠️ CREAR MANUALMENTE' 
    END as estado;

-- Mostrar columnas de payment_methods
SELECT 
    'Estructura payment_methods:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_methods'
ORDER BY ordinal_position;

-- Mostrar estructura de profiles (primeras 10 columnas)
SELECT 
    'Estructura profiles (muestra):' as info;
    
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position
LIMIT 10;