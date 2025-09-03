-- =====================================================
-- ANALIZAR Y REPARAR TABLA PROFILES
-- =====================================================

-- 1. PRIMERO: Analizar la estructura actual de la tabla
-- Ejecuta esta consulta para ver la estructura actual:
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Ver los constraints existentes
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_namespace nsp ON nsp.oid = con.connamespace
JOIN pg_class cls ON cls.oid = con.conrelid
WHERE nsp.nspname = 'public'
    AND cls.relname = 'profiles';

-- 3. Ver específicamente el constraint de kyc_status
SELECT 
    conname,
    pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname LIKE '%kyc_status%';

-- =====================================================
-- SOLUCIÓN: Actualizar el constraint de kyc_status
-- =====================================================

-- 4. Eliminar el constraint antiguo si existe
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_kyc_status_check;

-- 5. Agregar el nuevo constraint que permita 'pending' y 'not_started'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_kyc_status_check 
CHECK (kyc_status IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired'));

-- 6. Actualizar los valores existentes si es necesario
UPDATE public.profiles 
SET kyc_status = 'not_started' 
WHERE kyc_status IS NULL OR kyc_status = '';

-- 7. Establecer valor por defecto
ALTER TABLE public.profiles 
ALTER COLUMN kyc_status SET DEFAULT 'not_started';

-- =====================================================
-- SINCRONIZAR USUARIOS EXISTENTES
-- =====================================================

-- 8. Crear función mejorada para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        username,
        full_name,
        email_verified,
        verification_token,
        kyc_status,
        kyc_verified,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, FALSE),
        NEW.raw_user_meta_data->>'verification_token',
        'not_started',  -- Usar not_started en lugar de pending
        FALSE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Insertar perfiles para usuarios que no tienen
INSERT INTO public.profiles (
    id, 
    email, 
    username, 
    full_name, 
    created_at, 
    updated_at, 
    email_verified,
    kyc_status,
    kyc_verified
)
SELECT 
    id, 
    email,
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'full_name', email),
    created_at,
    NOW(),
    COALESCE(email_confirmed_at IS NOT NULL, FALSE),
    'not_started',
    FALSE
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 11. Actualizar email_verified para usuarios existentes
UPDATE public.profiles p
SET 
    email_verified = TRUE,
    updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id 
    AND u.email_confirmed_at IS NOT NULL
    AND p.email_verified IS NOT TRUE;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD
-- =====================================================

-- 12. Habilitar RLS si no está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 13. Eliminar políticas antiguas y crear nuevas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para permitir inserciones del sistema
CREATE POLICY "System can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- 14. Verificar usuarios y perfiles
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

-- 15. Mostrar algunos perfiles para verificar
SELECT 
    p.id,
    p.email,
    p.username,
    p.kyc_status,
    p.email_verified,
    p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 10;

-- 16. Verificar el usuario específico que daba error
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    p.id as profile_id,
    p.kyc_status,
    p.email_verified,
    p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = '5c64bd9e-2efc-4dde-af8f-6d3dd7a04146'
    OR u.email LIKE '%leonusertest%';

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Este script actualiza el constraint de kyc_status para permitir 'not_started'
-- 2. Sincroniza todos los usuarios con sus perfiles
-- 3. Configura las políticas de seguridad necesarias
-- 4. El valor por defecto para kyc_status es ahora 'not_started'
-- =====================================================