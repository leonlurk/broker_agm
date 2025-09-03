-- =====================================================
-- DIAGNÓSTICO SEGURO - SOLO LECTURA (VERSIÓN CORREGIDA)
-- No modifica nada, solo muestra información
-- =====================================================

-- 1. VER ESTRUCTURA COMPLETA DE LA TABLA PROFILES
-- Muestra todas las columnas con sus tipos y configuraciones
SELECT 
    ordinal_position as pos,
    column_name,
    data_type,
    character_maximum_length as max_length,
    column_default as default_value,
    is_nullable as nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. CONTAR TOTAL DE COLUMNAS
SELECT COUNT(*) as total_columnas
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles';

-- 3. VER TODOS LOS CONSTRAINTS DE LA TABLA
SELECT
    conname AS constraint_name,
    CASE contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'x' THEN 'EXCLUSION'
    END AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
ORDER BY contype, conname;

-- 4. VER ESPECÍFICAMENTE CONSTRAINTS RELACIONADOS CON KYC
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
    AND (conname LIKE '%kyc%' OR pg_get_constraintdef(oid) LIKE '%kyc%');

-- 5. VER INFORMACIÓN ESPECÍFICA DE LA COLUMNA KYC_STATUS
SELECT 
    ordinal_position as position,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'kyc_status';

-- 6. VER VALORES ÚNICOS ACTUALES EN KYC_STATUS
-- Muestra qué valores existen actualmente y cuántos de cada uno
SELECT 
    kyc_status,
    COUNT(*) as cantidad,
    CASE 
        WHEN kyc_status IS NULL THEN 'NULL'
        WHEN kyc_status = '' THEN 'VACÍO'
        ELSE 'VALOR'
    END as tipo
FROM public.profiles
GROUP BY kyc_status
ORDER BY cantidad DESC;

-- 7. VER ALGUNOS REGISTROS DE EJEMPLO
-- Muestra solo ID, email y kyc_status para entender los datos
SELECT 
    id,
    email,
    kyc_status,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- 8. VERIFICAR INTEGRIDAD REFERENCIAL
-- Ver si hay usuarios sin perfil
SELECT 
    'Usuarios totales en auth.users' as descripcion,
    COUNT(*) as cantidad
FROM auth.users
UNION ALL
SELECT 
    'Perfiles totales en profiles' as descripcion,
    COUNT(*) as cantidad
FROM public.profiles
UNION ALL
SELECT 
    'Usuarios SIN perfil' as descripcion,
    COUNT(*) as cantidad
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
UNION ALL
SELECT 
    'Perfiles SIN usuario (huérfanos)' as descripcion,
    COUNT(*) as cantidad
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

-- 9. VER EL USUARIO ESPECÍFICO QUE DA PROBLEMAS
SELECT 
    u.id,
    u.email as auth_email,
    u.created_at as user_created,
    u.email_confirmed_at,
    p.id as profile_id,
    p.email as profile_email,
    p.kyc_status,
    p.email_verified,
    p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = '5c64bd9e-2efc-4dde-af8f-6d3dd7a04146';

-- 10. VER SI HAY VALORES PROBLEMÁTICOS EN KYC_STATUS
-- Identifica valores que podrían no estar en el constraint
SELECT 
    kyc_status,
    LENGTH(kyc_status) as longitud,
    COUNT(*) as cantidad
FROM public.profiles
WHERE kyc_status NOT IN ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired')
    OR kyc_status IS NULL
GROUP BY kyc_status
ORDER BY cantidad DESC;

-- 11. VER ÍNDICES EN LA TABLA
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'profiles';

-- 12. VER SI HAY TRIGGERS EN LA TABLA
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND event_object_table = 'profiles';

-- 13. INFORMACIÓN SIMPLIFICADA DEL CONSTRAINT DE KYC_STATUS
SELECT 
    c.conname as constraint_name,
    pg_get_constraintdef(c.oid, true) as definition
FROM pg_constraint c
WHERE c.conrelid = 'public.profiles'::regclass
    AND c.conname LIKE '%kyc%';

-- 14. VER PRIMERAS 3 COLUMNAS DE ALGUNOS REGISTROS
-- Para entender mejor la estructura sin mostrar datos sensibles
SELECT 
    substring(id::text, 1, 8) as id_partial,
    substring(email, 1, 10) || '...' as email_partial,
    kyc_status
FROM public.profiles
LIMIT 10;

-- =====================================================
-- IMPORTANTE - EJECUTAR ESTAS CONSULTAS CLAVE:
-- =====================================================

-- A. ¿QUÉ CONSTRAINT EXACTO ESTÁ FALLANDO?
SELECT 
    conname,
    pg_get_constraintdef(oid) as definicion_completa
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
    AND conname = 'profiles_kyc_status_check';

-- B. ¿QUÉ VALORES TIENE KYC_STATUS?
SELECT 
    COALESCE(kyc_status, '[NULL]') as valor_kyc_status,
    COUNT(*) as cantidad
FROM public.profiles
GROUP BY kyc_status
ORDER BY cantidad DESC;

-- C. ¿HAY USUARIOS SIN PERFIL?
SELECT COUNT(*) as usuarios_sin_perfil
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = u.id
);

-- =====================================================
-- DESPUÉS DE EJECUTAR ESTO:
-- =====================================================
-- Comparte principalmente los resultados de:
-- 1. Consulta #1 (estructura de la tabla)
-- 2. Consulta #4 (constraints de kyc)
-- 3. Consulta #6 (valores actuales de kyc_status)
-- 4. Consultas A, B y C al final
-- 
-- Con esa información podremos crear un script específico
-- que solucione el problema sin romper nada
-- =====================================================