-- =====================================================
-- INVESTIGAR ESTRUCTURA REAL DE LA TABLA PROFILES
-- =====================================================

-- 1. Ver TODAS las columnas de la tabla profiles con su posición
SELECT 
    ordinal_position,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Contar cuántas columnas tiene la tabla
SELECT COUNT(*) as total_columnas
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles';

-- 3. Ver TODOS los constraints de la tabla
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- 4. Buscar específicamente la columna kyc_status y su posición
SELECT 
    ordinal_position,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name LIKE '%kyc%'
ORDER BY ordinal_position;

-- 5. Ver el constraint actual de kyc_status
SELECT 
    conname,
    pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
    AND conname LIKE '%kyc%';

-- 6. Ver algunos registros actuales con sus valores de kyc_status
SELECT 
    id,
    email,
    kyc_status,
    created_at
FROM public.profiles
LIMIT 5;

-- 7. Ver qué valores únicos tiene kyc_status actualmente
SELECT DISTINCT 
    kyc_status,
    COUNT(*) as cantidad
FROM public.profiles
GROUP BY kyc_status
ORDER BY kyc_status;

-- =====================================================
-- SOLUCIÓN BASADA EN LA ESTRUCTURA REAL
-- =====================================================

-- 8. Primero, actualizar TODOS los valores de kyc_status que puedan estar causando problemas
-- Actualizar NULL a 'not_started'
UPDATE public.profiles 
SET kyc_status = 'not_started' 
WHERE kyc_status IS NULL;

-- Actualizar valores vacíos a 'not_started'
UPDATE public.profiles 
SET kyc_status = 'not_started' 
WHERE kyc_status = '';

-- 9. Ver si quedan valores problemáticos
SELECT id, email, kyc_status
FROM public.profiles
WHERE kyc_status NOT IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired')
    AND kyc_status IS NOT NULL;

-- 10. Si el paso 9 muestra registros, actualízalos
UPDATE public.profiles 
SET kyc_status = 'not_started' 
WHERE kyc_status NOT IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired')
    AND kyc_status IS NOT NULL;

-- 11. Ahora sí, eliminar el constraint problemático
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_kyc_status_check;

-- 12. Crear un nuevo constraint más permisivo
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_kyc_status_check 
CHECK (
    kyc_status IS NULL 
    OR kyc_status IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired')
);

-- 13. Establecer un valor por defecto
ALTER TABLE public.profiles 
ALTER COLUMN kyc_status SET DEFAULT 'not_started';

-- =====================================================
-- FUNCIÓN MEJORADA PARA CREAR PERFILES
-- =====================================================

-- 14. Crear función que maneje la estructura real de la tabla
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_username TEXT;
    v_full_name TEXT;
BEGIN
    -- Generar username y full_name seguros
    v_username := COALESCE(
        NEW.raw_user_meta_data->>'username', 
        split_part(NEW.email, '@', 1)
    );
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.email
    );
    
    -- Intentar insertar con manejo de errores
    BEGIN
        INSERT INTO public.profiles (
            id,
            email,
            username,
            full_name,
            kyc_status,
            email_verified,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            NEW.email,
            v_username,
            v_full_name,
            'not_started',
            COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, FALSE),
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();
    EXCEPTION
        WHEN unique_violation THEN
            -- Si hay violación de unique (probablemente username), intentar con username modificado
            INSERT INTO public.profiles (
                id,
                email,
                username,
                full_name,
                kyc_status,
                email_verified,
                created_at,
                updated_at
            )
            VALUES (
                NEW.id,
                NEW.email,
                v_username || '_' || substr(NEW.id::text, 1, 8),
                v_full_name,
                'not_started',
                FALSE,
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                updated_at = NOW();
        WHEN others THEN
            -- Loguear el error pero no fallar
            RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- CREAR PERFILES FALTANTES
-- =====================================================

-- 16. Ver usuarios sin perfil
SELECT 
    u.id,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 17. Crear perfiles para usuarios que no tienen (con manejo seguro)
DO $$
DECLARE
    user_record RECORD;
    v_username TEXT;
BEGIN
    FOR user_record IN 
        SELECT u.* 
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        v_username := COALESCE(
            user_record.raw_user_meta_data->>'username',
            split_part(user_record.email, '@', 1)
        );
        
        -- Intentar insertar el perfil
        BEGIN
            INSERT INTO public.profiles (
                id,
                email,
                username,
                full_name,
                kyc_status,
                email_verified,
                created_at,
                updated_at
            )
            VALUES (
                user_record.id,
                user_record.email,
                v_username,
                COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email),
                'not_started',
                user_record.email_confirmed_at IS NOT NULL,
                NOW(),
                NOW()
            );
        EXCEPTION
            WHEN unique_violation THEN
                -- Si el username ya existe, agregar un sufijo único
                INSERT INTO public.profiles (
                    id,
                    email,
                    username,
                    full_name,
                    kyc_status,
                    email_verified,
                    created_at,
                    updated_at
                )
                VALUES (
                    user_record.id,
                    user_record.email,
                    v_username || '_' || substr(user_record.id::text, 1, 8),
                    COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email),
                    'not_started',
                    user_record.email_confirmed_at IS NOT NULL,
                    NOW(),
                    NOW()
                );
            WHEN others THEN
                RAISE WARNING 'No se pudo crear perfil para %: %', user_record.email, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- 18. Verificar el resultado
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
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 19. Verificar el usuario problemático específico
SELECT 
    u.id,
    u.email,
    p.kyc_status,
    p.email_verified
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = '5c64bd9e-2efc-4dde-af8f-6d3dd7a04146';

-- =====================================================
-- NOTAS:
-- =====================================================
-- Ejecuta este script sección por sección:
-- 1. Primero las consultas de investigación (1-7)
-- 2. Luego las actualizaciones de datos (8-10)
-- 3. Después el constraint (11-13)
-- 4. Finalmente la creación de perfiles (14-17)
-- 5. Verifica con las consultas finales (18-19)
-- =====================================================