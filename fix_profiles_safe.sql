-- =====================================================
-- REPARAR TABLA PROFILES DE FORMA SEGURA
-- =====================================================

-- 1. PRIMERO: Ver qué valores actuales tiene kyc_status
SELECT DISTINCT kyc_status, COUNT(*) as cantidad
FROM public.profiles
GROUP BY kyc_status
ORDER BY kyc_status;

-- 2. Ver el constraint actual
SELECT 
    conname,
    pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname LIKE '%kyc_status%';

-- 3. Ver algunos registros para entender los datos
SELECT id, email, kyc_status, created_at
FROM public.profiles
LIMIT 10;

-- =====================================================
-- PASO 1: LIMPIAR DATOS EXISTENTES
-- =====================================================

-- 4. Actualizar valores NULL o vacíos
UPDATE public.profiles 
SET kyc_status = 'not_started' 
WHERE kyc_status IS NULL OR kyc_status = '';

-- 5. Actualizar valores que no son válidos
-- Primero veamos qué valores problemáticos hay
SELECT id, email, kyc_status
FROM public.profiles
WHERE kyc_status NOT IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired')
LIMIT 20;

-- 6. Actualizar todos los valores problemáticos a 'not_started'
UPDATE public.profiles 
SET kyc_status = 'not_started' 
WHERE kyc_status NOT IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired');

-- =====================================================
-- PASO 2: ELIMINAR Y RECREAR EL CONSTRAINT
-- =====================================================

-- 7. Eliminar el constraint existente
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_kyc_status_check;

-- 8. Crear el nuevo constraint con todos los valores permitidos
-- NOTA: Si hay otros valores en tu base de datos, agrégalos aquí
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_kyc_status_check 
CHECK (kyc_status IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired')
    OR kyc_status IS NULL);

-- =====================================================
-- PASO 3: ESTABLECER VALOR POR DEFECTO
-- =====================================================

-- 9. Establecer valor por defecto para nuevos registros
ALTER TABLE public.profiles 
ALTER COLUMN kyc_status SET DEFAULT 'not_started';

-- =====================================================
-- PASO 4: CREAR O ACTUALIZAR FUNCIÓN PARA NUEVOS USUARIOS
-- =====================================================

-- 10. Función para manejar nuevos usuarios
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
        COALESCE(NEW.raw_user_meta_data->>'kyc_status', 'not_started'),
        FALSE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Si hay cualquier error, loguear pero no fallar
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PASO 5: CREAR PERFILES FALTANTES
-- =====================================================

-- 12. Crear perfiles para usuarios sin perfil
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
    u.id, 
    u.email,
    COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
    COALESCE(u.raw_user_meta_data->>'full_name', u.email),
    u.created_at,
    NOW(),
    COALESCE(u.email_confirmed_at IS NOT NULL, FALSE),
    'not_started',
    FALSE
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PASO 6: POLÍTICAS DE SEGURIDAD
-- =====================================================

-- 13. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 14. Recrear políticas básicas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- 15. Verificar estado final
SELECT 
    'Total usuarios' as descripcion,
    COUNT(*) as cantidad
FROM auth.users
UNION ALL
SELECT 
    'Total perfiles' as descripcion,
    COUNT(*) as cantidad
FROM public.profiles
UNION ALL
SELECT 
    'Usuarios sin perfil' as descripcion,
    COUNT(*) as cantidad
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- 16. Verificar distribución de kyc_status
SELECT kyc_status, COUNT(*) as cantidad
FROM public.profiles
GROUP BY kyc_status
ORDER BY cantidad DESC;

-- 17. Verificar el usuario específico problemático
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
WHERE u.id = '5c64bd9e-2efc-4dde-af8f-6d3dd7a04146';

-- =====================================================
-- SI AÚN HAY PROBLEMAS:
-- =====================================================
-- Ejecuta esta consulta para ver qué valores exactos están causando problemas:
/*
SELECT id, email, kyc_status, length(kyc_status) as longitud
FROM public.profiles
WHERE kyc_status NOT IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired');
*/

-- Si encuentras valores extraños, actualízalos manualmente:
/*
UPDATE public.profiles
SET kyc_status = 'not_started'
WHERE id = 'ID_DEL_REGISTRO_PROBLEMÁTICO';
*/