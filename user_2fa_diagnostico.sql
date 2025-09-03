-- ============================================
-- Diagnóstico de la tabla user_2fa
-- ============================================

-- 1. Verificar si la tabla existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_2fa'
) as tabla_existe;

-- 2. Ver todas las columnas de la tabla (si existe)
SELECT 
    column_name as columna,
    data_type as tipo_dato,
    is_nullable as permite_null,
    column_default as valor_por_defecto,
    character_maximum_length as longitud_maxima
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_2fa'
ORDER BY ordinal_position;

-- 3. Ver las restricciones (constraints) de la tabla
SELECT 
    constraint_name as restriccion,
    constraint_type as tipo
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
AND table_name = 'user_2fa';

-- 4. Ver los índices de la tabla
SELECT 
    indexname as indice,
    indexdef as definicion
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'user_2fa';

-- 5. Ver las políticas RLS activas
SELECT 
    policyname as politica,
    permissive as permisiva,
    roles,
    cmd as comando,
    qual as condicion_using,
    with_check as condicion_with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'user_2fa';

-- 6. Contar cuántos registros hay (si existe la tabla)
SELECT COUNT(*) as total_registros 
FROM public.user_2fa;

-- 7. Ver algunos registros de ejemplo (solo columnas básicas)
-- NOTA: Comenta esta línea si no quieres ver datos
SELECT id, user_id, created_at 
FROM public.user_2fa 
LIMIT 5;