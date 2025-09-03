-- ============================================
-- Fix and setup for user_2fa table
-- ============================================

-- Primero, verificar si la tabla existe y qué columnas tiene
DO $$ 
BEGIN
    -- Si la tabla existe pero le falta la columna method, agregarla
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_2fa' AND table_schema = 'public') THEN
        -- Agregar columna method si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_2fa' AND column_name = 'method') THEN
            ALTER TABLE public.user_2fa ADD COLUMN method TEXT NOT NULL DEFAULT 'app' CHECK (method IN ('app', 'sms', 'email'));
        END IF;
        
        -- Agregar columna secret si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_2fa' AND column_name = 'secret') THEN
            ALTER TABLE public.user_2fa ADD COLUMN secret TEXT;
        END IF;
        
        -- Agregar columna verified si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_2fa' AND column_name = 'verified') THEN
            ALTER TABLE public.user_2fa ADD COLUMN verified BOOLEAN DEFAULT false;
        END IF;
        
        -- Agregar columna backup_codes si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_2fa' AND column_name = 'backup_codes') THEN
            ALTER TABLE public.user_2fa ADD COLUMN backup_codes TEXT[];
        END IF;
        
        -- Agregar columna phone_number si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_2fa' AND column_name = 'phone_number') THEN
            ALTER TABLE public.user_2fa ADD COLUMN phone_number TEXT;
        END IF;
        
        -- Agregar columna last_used_at si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_2fa' AND column_name = 'last_used_at') THEN
            ALTER TABLE public.user_2fa ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;
        END IF;
        
        -- Agregar columna updated_at si no existe
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_2fa' AND column_name = 'updated_at') THEN
            ALTER TABLE public.user_2fa ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
        END IF;
        
    ELSE
        -- Si la tabla no existe, crearla
        CREATE TABLE public.user_2fa (
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
    END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON public.user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_method ON public.user_2fa(method) WHERE method IS NOT NULL;

-- Habilitar RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can delete their own 2FA settings" ON public.user_2fa;

-- Crear nuevas políticas
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

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS update_user_2fa_updated_at ON public.user_2fa;
CREATE TRIGGER update_user_2fa_updated_at
BEFORE UPDATE ON public.user_2fa
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Otorgar permisos
GRANT ALL ON public.user_2fa TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_2fa' AND table_schema = 'public'
ORDER BY ordinal_position;