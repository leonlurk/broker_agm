-- ====================================
-- SCRIPT CORREGIDO PARA ESTRUCTURA EXISTENTE
-- ====================================

-- Primero, verificar qué tabla de usuarios existe
DO $$ 
BEGIN
    -- Verificar si existe la tabla 'users' en el schema public
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE NOTICE 'Tabla users encontrada en public schema';
        
        -- Agregar columna photourl si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'users' 
                      AND column_name = 'photourl') THEN
            ALTER TABLE users ADD COLUMN photourl TEXT;
            RAISE NOTICE 'Columna photourl agregada a users';
        END IF;
    ELSE
        -- Si no existe users, crear la tabla
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT,
            username TEXT UNIQUE,
            full_name TEXT,
            phone TEXT,
            country TEXT,
            photourl TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Habilitar RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        
        -- Crear políticas básicas
        CREATE POLICY "Users can view own profile" ON users
            FOR SELECT USING (auth.uid() = id);
            
        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (auth.uid() = id);
            
        RAISE NOTICE 'Tabla users creada con políticas RLS';
    END IF;
END $$;

-- ====================================
-- CREAR TABLA PAYMENT_METHODS
-- ====================================

-- Eliminar restricciones anteriores si existen
DROP TABLE IF EXISTS payment_methods CASCADE;

-- Crear la tabla payment_methods
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
    
    -- Constraint más flexible
    CONSTRAINT payment_method_fields_check CHECK (
        (type = 'crypto' AND address IS NOT NULL) OR
        (type = 'bank' AND cbu IS NOT NULL)
    )
);

-- Crear índices
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_is_active ON payment_methods(is_active);

-- Habilitar RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para payment_methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para payment_methods
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- CONFIGURAR STORAGE (Solo estructura, el bucket se crea manualmente)
-- ====================================

-- Verificar si el bucket existe (esto solo muestra info)
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM storage.buckets WHERE id = 'profile-pictures') 
        THEN 'Bucket profile-pictures existe' 
        ELSE 'NECESITAS CREAR EL BUCKET profile-pictures MANUALMENTE EN SUPABASE DASHBOARD' 
    END as bucket_status;

-- Intentar crear políticas de storage (pueden fallar si el bucket no existe)
DO $$ 
BEGIN
    -- Solo crear políticas si el bucket existe
    IF EXISTS (SELECT FROM storage.buckets WHERE id = 'profile-pictures') THEN
        
        -- Eliminar políticas existentes si las hay
        DROP POLICY IF EXISTS "Users can upload own profile pictures" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update own profile pictures" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete own profile pictures" ON storage.objects;
        DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
        
        -- Crear nuevas políticas
        CREATE POLICY "Users can upload own profile pictures" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'profile-pictures' AND 
                auth.uid()::text = (storage.foldername(name))[1]
            );

        CREATE POLICY "Users can update own profile pictures" ON storage.objects
            FOR UPDATE USING (
                bucket_id = 'profile-pictures' AND 
                auth.uid()::text = (storage.foldername(name))[1]
            );

        CREATE POLICY "Users can delete own profile pictures" ON storage.objects
            FOR DELETE USING (
                bucket_id = 'profile-pictures' AND 
                auth.uid()::text = (storage.foldername(name))[1]
            );

        CREATE POLICY "Anyone can view profile pictures" ON storage.objects
            FOR SELECT USING (bucket_id = 'profile-pictures');
            
        RAISE NOTICE 'Políticas de storage creadas exitosamente';
    ELSE
        RAISE NOTICE 'IMPORTANTE: Debes crear el bucket profile-pictures manualmente en Supabase Dashboard > Storage';
    END IF;
END $$;

-- ====================================
-- VERIFICACIÓN FINAL
-- ====================================

-- Verificar payment_methods
SELECT 
    'payment_methods' as tabla,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_methods') 
        THEN '✓ CREADA' 
        ELSE '✗ ERROR' 
    END as estado;

-- Verificar columna photourl
SELECT 
    'photourl en users' as columna,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'photourl'
        ) 
        THEN '✓ EXISTE' 
        ELSE '✗ NO EXISTE' 
    END as estado;

-- Verificar bucket (informativo)
SELECT 
    'profile-pictures bucket' as componente,
    CASE 
        WHEN EXISTS (SELECT FROM storage.buckets WHERE id = 'profile-pictures') 
        THEN '✓ EXISTE' 
        ELSE '⚠ CREAR MANUALMENTE EN DASHBOARD' 
    END as estado;

-- Mostrar estructura de payment_methods
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_methods'
ORDER BY ordinal_position;