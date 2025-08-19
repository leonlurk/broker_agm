-- ====================================
-- PARTE 1: CREAR TABLA PAYMENT_METHODS
-- ====================================

-- Crear la tabla payment_methods si no existe
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
    
    -- Constraint para asegurar que cada método tiene los campos correctos
    CONSTRAINT payment_method_fields_check CHECK (
        (type = 'crypto' AND network IS NOT NULL AND address IS NOT NULL) OR
        (type = 'bank' AND cbu IS NOT NULL AND holder_name IS NOT NULL AND holder_id IS NOT NULL)
    )
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios métodos de pago
CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propios métodos de pago
CREATE POLICY "Users can insert own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propios métodos de pago
CREATE POLICY "Users can update own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propios métodos de pago
CREATE POLICY "Users can delete own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar el timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- PARTE 2: CONFIGURAR STORAGE BUCKET
-- ====================================

-- Crear el bucket para fotos de perfil si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de storage para fotos de perfil
-- Permitir a los usuarios subir sus propias fotos
CREATE POLICY "Users can upload own profile pictures" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Permitir a los usuarios actualizar sus propias fotos
CREATE POLICY "Users can update own profile pictures" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Permitir a los usuarios eliminar sus propias fotos
CREATE POLICY "Users can delete own profile pictures" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Permitir a todos ver las fotos de perfil (bucket público)
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-pictures');

-- ====================================
-- PARTE 3: AGREGAR COLUMNA PHOTOURL A PROFILES SI NO EXISTE
-- ====================================

-- Agregar columna photourl a la tabla profiles si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photourl TEXT;

-- ====================================
-- PARTE 4: VERIFICAR Y MOSTRAR RESULTADOS
-- ====================================

-- Verificar que la tabla payment_methods fue creada
SELECT 
    'payment_methods table' as component,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_methods') 
        THEN 'CREATED ✓' 
        ELSE 'FAILED ✗' 
    END as status;

-- Verificar que el bucket fue creado
SELECT 
    'profile-pictures bucket' as component,
    CASE 
        WHEN EXISTS (SELECT FROM storage.buckets WHERE id = 'profile-pictures') 
        THEN 'CREATED ✓' 
        ELSE 'FAILED ✗' 
    END as status;

-- Verificar que la columna photourl existe
SELECT 
    'photourl column in profiles' as component,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'photourl'
        ) 
        THEN 'EXISTS ✓' 
        ELSE 'FAILED ✗' 
    END as status;