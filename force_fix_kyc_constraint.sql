-- =====================================================
-- DIAGNÓSTICO Y SOLUCIÓN FORZADA PARA KYC_STATUS
-- =====================================================

-- PASO 1: DIAGNÓSTICO COMPLETO
-- Ejecuta cada consulta por separado para entender el problema

-- 1.1 Ver el constraint actual EXACTO
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
    AND conname LIKE '%kyc%';

-- 1.2 Ver qué valores tiene actualmente kyc_status
SELECT DISTINCT kyc_status, COUNT(*) as cantidad
FROM public.profiles
GROUP BY kyc_status
ORDER BY kyc_status;

-- 1.3 Ver la posición de la columna kyc_status
SELECT 
    ordinal_position,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'kyc_status';

-- =====================================================
-- PASO 2: SOLUCIÓN NUCLEAR - ELIMINAR TODO CONSTRAINT
-- =====================================================

-- 2.1 Primero, eliminar TODOS los constraints relacionados con kyc_status
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.profiles'::regclass 
            AND conname LIKE '%kyc%'
    ) 
    LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- 2.2 Verificar que se eliminaron
SELECT COUNT(*) as constraints_restantes
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
    AND conname LIKE '%kyc%';

-- =====================================================
-- PASO 3: LIMPIAR DATOS EXISTENTES
-- =====================================================

-- 3.1 Ver qué valores problemáticos hay
SELECT id, email, kyc_status, length(kyc_status) as longitud
FROM public.profiles
WHERE kyc_status IS NOT NULL
    AND kyc_status NOT IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired')
LIMIT 10;

-- 3.2 Actualizar TODOS los valores a algo seguro
UPDATE public.profiles 
SET kyc_status = 'not_started'
WHERE kyc_status IS NULL 
    OR kyc_status = ''
    OR kyc_status NOT IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired');

-- 3.3 Verificar que no quedan valores problemáticos
SELECT COUNT(*) as registros_problematicos
FROM public.profiles
WHERE kyc_status NOT IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired');

-- =====================================================
-- PASO 4: CREAR CONSTRAINT NUEVO (OPCIONAL)
-- =====================================================

-- 4.1 Solo si quieres un constraint, créalo DESPUÉS de limpiar los datos
-- NOTA: Puedes omitir este paso si prefieres no tener constraint
/*
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_kyc_status_check 
CHECK (kyc_status IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired'));
*/

-- 4.2 O si prefieres un constraint más permisivo que permite NULL
/*
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_kyc_status_check 
CHECK (kyc_status IS NULL OR kyc_status IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired'));
*/

-- =====================================================
-- PASO 5: ESTABLECER VALOR POR DEFECTO
-- =====================================================

ALTER TABLE public.profiles 
ALTER COLUMN kyc_status SET DEFAULT 'not_started';

-- =====================================================
-- PASO 6: CREAR PERFILES FALTANTES SIN CONSTRAINTS
-- =====================================================

-- 6.1 Función simple sin complicaciones
CREATE OR REPLACE FUNCTION public.create_profile_for_user(user_id UUID)
RETURNS void AS $$
DECLARE
    user_record RECORD;
    v_username TEXT;
BEGIN
    -- Obtener datos del usuario
    SELECT * INTO user_record FROM auth.users WHERE id = user_id;
    
    IF user_record.id IS NULL THEN
        RETURN;
    END IF;
    
    -- Generar username
    v_username := COALESCE(
        user_record.raw_user_meta_data->>'username',
        split_part(user_record.email, '@', 1)
    );
    
    -- Insertar perfil con valores mínimos
    INSERT INTO public.profiles (id, email, username, kyc_status)
    VALUES (user_record.id, user_record.email, v_username, 'not_started')
    ON CONFLICT (id) DO NOTHING;
    
EXCEPTION
    WHEN others THEN
        -- Si hay cualquier error, intentar con username único
        INSERT INTO public.profiles (id, email, username, kyc_status)
        VALUES (user_record.id, user_record.email, v_username || '_' || substr(user_id::text, 1, 8), 'not_started')
        ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 6.2 Crear perfiles para todos los usuarios sin perfil
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT u.id
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        PERFORM public.create_profile_for_user(user_record.id);
    END LOOP;
END $$;

-- =====================================================
-- PASO 7: VERIFICACIÓN FINAL
-- =====================================================

-- 7.1 Verificar que no hay constraints problemáticos
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
    AND conname LIKE '%kyc%';

-- 7.2 Verificar valores de kyc_status
SELECT kyc_status, COUNT(*) as cantidad
FROM public.profiles
GROUP BY kyc_status;

-- 7.3 Verificar usuario específico
SELECT 
    u.id,
    u.email,
    p.id as profile_id,
    p.kyc_status,
    p.email_verified
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = '5c64bd9e-2efc-4dde-af8f-6d3dd7a04146';

-- 7.4 Verificar totales
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_usuarios,
    (SELECT COUNT(*) FROM public.profiles) as total_perfiles,
    (SELECT COUNT(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)) as usuarios_sin_perfil;

-- =====================================================
-- SI TODO LO ANTERIOR FALLA:
-- =====================================================

-- OPCIÓN NUCLEAR: Permitir cualquier valor en kyc_status
-- 1. Eliminar la columna y recrearla sin constraints
/*
ALTER TABLE public.profiles 
    DROP COLUMN IF EXISTS kyc_status CASCADE;

ALTER TABLE public.profiles 
    ADD COLUMN kyc_status TEXT DEFAULT 'not_started';

UPDATE public.profiles 
    SET kyc_status = 'not_started' 
    WHERE kyc_status IS NULL;
*/

-- =====================================================
-- INSTRUCCIONES:
-- =====================================================
-- 1. Ejecuta PASO 1 para diagnóstico
-- 2. Ejecuta PASO 2 para eliminar constraints
-- 3. Ejecuta PASO 3 para limpiar datos
-- 4. OMITE PASO 4 por ahora (no crear constraint)
-- 5. Ejecuta PASO 5 y 6 para configurar defaults y crear perfiles
-- 6. Ejecuta PASO 7 para verificar
-- 
-- Si aún hay problemas, usa la OPCIÓN NUCLEAR al final
-- =====================================================