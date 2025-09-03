-- =====================================================
-- FIX PROFILES TABLE - Solución para error 406
-- =====================================================

-- 1. Primero verificar si la tabla profiles existe
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    username TEXT UNIQUE,
    full_name TEXT,
    phone TEXT,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    kyc_status TEXT DEFAULT 'pending',
    kyc_verified BOOLEAN DEFAULT FALSE,
    wallet_address TEXT,
    referral_code TEXT,
    referred_by TEXT,
    is_broker_user BOOLEAN DEFAULT TRUE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    two_factor_backup_codes TEXT[],
    payment_methods JSONB DEFAULT '[]'::jsonb,
    role TEXT DEFAULT 'user',
    permissions JSONB DEFAULT '{}'::jsonb,
    avatar_url TEXT,
    bio TEXT,
    language TEXT DEFAULT 'es',
    notification_preferences JSONB DEFAULT '{"email": true, "push": false}'::jsonb,
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    account_status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- 3. Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        username,
        email_verified,
        verification_token,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, FALSE),
        NEW.raw_user_meta_data->>'verification_token',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Sincronizar usuarios existentes que no tienen perfil
INSERT INTO public.profiles (id, email, username, full_name, created_at, updated_at, email_verified)
SELECT 
    id, 
    email,
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'full_name', email),
    created_at,
    NOW(),
    COALESCE(email_confirmed_at IS NOT NULL, FALSE)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 6. Actualizar email_verified para usuarios existentes
UPDATE public.profiles p
SET 
    email_verified = TRUE,
    updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id 
    AND u.email_confirmed_at IS NOT NULL
    AND p.email_verified = FALSE;

-- 7. Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de seguridad
-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para permitir que el sistema cree perfiles
CREATE POLICY "System can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- Política para administradores (opcional)
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Función para verificar y reparar perfiles faltantes
CREATE OR REPLACE FUNCTION public.ensure_user_profile(user_id UUID)
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Obtener datos del usuario
    SELECT * INTO user_record FROM auth.users WHERE id = user_id;
    
    -- Si el usuario existe pero no tiene perfil, crearlo
    IF user_record.id IS NOT NULL THEN
        INSERT INTO public.profiles (
            id, 
            email, 
            username,
            full_name,
            email_verified,
            created_at,
            updated_at
        )
        VALUES (
            user_record.id,
            user_record.email,
            COALESCE(user_record.raw_user_meta_data->>'username', split_part(user_record.email, '@', 1)),
            COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email),
            user_record.email_confirmed_at IS NOT NULL,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            email_verified = EXCLUDED.email_verified,
            updated_at = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Verificar y mostrar usuarios sin perfil (para debug)
SELECT 
    u.id,
    u.email,
    u.created_at,
    CASE WHEN p.id IS NULL THEN 'SIN PERFIL' ELSE 'CON PERFIL' END as estado_perfil
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 11. Contar registros
SELECT 
    'Usuarios totales' as descripcion,
    COUNT(*) as cantidad
FROM auth.users
UNION ALL
SELECT 
    'Perfiles totales' as descripcion,
    COUNT(*) as cantidad
FROM public.profiles
UNION ALL
SELECT 
    'Usuarios sin perfil' as descripcion,
    COUNT(*) as cantidad
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================
-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. Verifica los resultados de las últimas consultas
-- 3. Si hay usuarios sin perfil, se habrán creado automáticamente
-- 4. El trigger asegurará que futuros usuarios tengan perfil
-- =====================================================