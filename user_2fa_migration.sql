-- ============================================
-- Migración de la tabla user_2fa
-- Agrega las columnas faltantes sin perder datos
-- ============================================

-- 1. Agregar las columnas faltantes a la tabla existente
ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'app' CHECK (method IN ('app', 'sms', 'email'));

ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS secret TEXT;

ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS backup_codes TEXT[];

ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- 2. Actualizar los registros existentes para establecer updated_at
UPDATE public.user_2fa 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 3. Crear constraint único para user_id + method (si no existe)
-- Primero, eliminar duplicados si existen (mantener el más reciente)
DELETE FROM public.user_2fa a
USING public.user_2fa b
WHERE a.id < b.id 
AND a.user_id = b.user_id;

-- Ahora agregar el constraint único
ALTER TABLE public.user_2fa 
ADD CONSTRAINT user_2fa_user_id_method_key UNIQUE (user_id, method);

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON public.user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_method ON public.user_2fa(method);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- 6. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can delete their own 2FA settings" ON public.user_2fa;

-- 7. Crear políticas RLS
CREATE POLICY "Users can view their own 2FA settings" 
ON public.user_2fa FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings" 
ON public.user_2fa FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings" 
ON public.user_2fa FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own 2FA settings" 
ON public.user_2fa FOR DELETE 
USING (auth.uid() = user_id);

-- 8. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_user_2fa_updated_at ON public.user_2fa;
CREATE TRIGGER update_user_2fa_updated_at
BEFORE UPDATE ON public.user_2fa
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 10. Otorgar permisos
GRANT ALL ON public.user_2fa TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 11. Verificar la estructura final
SELECT 
    column_name as columna,
    data_type as tipo_dato,
    is_nullable as permite_null,
    column_default as valor_por_defecto
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_2fa'
ORDER BY ordinal_position;

-- 12. Verificar los datos actualizados
SELECT * FROM public.user_2fa LIMIT 5;