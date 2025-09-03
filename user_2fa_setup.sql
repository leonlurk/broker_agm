-- ============================================
-- Setup for user_2fa table and permissions
-- ============================================

-- 1. Crear la tabla user_2fa si no existe
CREATE TABLE IF NOT EXISTS public.user_2fa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('app', 'sms', 'email')),
    secret TEXT,
    verified BOOLEAN DEFAULT false,
    backup_codes TEXT[],
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_used_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, method)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON public.user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_method ON public.user_2fa(method);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas existentes si las hay (para evitar conflictos)
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can delete their own 2FA settings" ON public.user_2fa;

-- 5. Crear políticas RLS
-- Política para SELECT (ver)
CREATE POLICY "Users can view their own 2FA settings" 
ON public.user_2fa FOR SELECT 
USING (auth.uid() = user_id);

-- Política para INSERT (crear)
CREATE POLICY "Users can insert their own 2FA settings" 
ON public.user_2fa FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (actualizar)
CREATE POLICY "Users can update their own 2FA settings" 
ON public.user_2fa FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para DELETE (eliminar)
CREATE POLICY "Users can delete their own 2FA settings" 
ON public.user_2fa FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_user_2fa_updated_at ON public.user_2fa;
CREATE TRIGGER update_user_2fa_updated_at
BEFORE UPDATE ON public.user_2fa
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 8. Otorgar permisos a los usuarios autenticados
GRANT ALL ON public.user_2fa TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 9. Otorgar permisos para usuarios anónimos (solo si es necesario para tu app)
-- GRANT SELECT ON public.user_2fa TO anon;

-- 10. Verificar que la tabla existe y tiene la estructura correcta
-- Puedes ejecutar este query para verificar:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'user_2fa'
-- ORDER BY ordinal_position;