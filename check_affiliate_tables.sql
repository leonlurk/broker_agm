-- =====================================================
-- SQL PARA VERIFICAR TABLAS DE AFILIADOS EXISTENTES
-- =====================================================

-- 1. Ver todas las tablas que contengan "referr" o "affil" en su nombre
SELECT 
    schemaname,
    tablename,
    tableowner
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
    AND (
        tablename LIKE '%referr%' 
        OR tablename LIKE '%affil%'
        OR tablename LIKE '%commission%'
        OR tablename LIKE '%tier%'
    )
ORDER BY 
    tablename;

-- 2. Verificar si existe la tabla user_referrals
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_referrals'
) AS user_referrals_exists;

-- 3. Verificar si existe la tabla affiliate_payments
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliate_payments'
) AS affiliate_payments_exists;

-- 4. Verificar si existe la tabla affiliate_commissions
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliate_commissions'
) AS affiliate_commissions_exists;

-- 5. Ver estructura de la tabla users para verificar campos de referidos
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
    AND (
        column_name LIKE '%refer%'
        OR column_name LIKE '%affil%'
        OR column_name = 'metadata'
    )
ORDER BY 
    ordinal_position;

-- 6. Buscar cualquier función RPC relacionada con afiliados
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public'
    AND (
        routine_name LIKE '%referr%'
        OR routine_name LIKE '%affil%'
        OR routine_name LIKE '%commission%'
    );

-- 7. Ver si hay vistas relacionadas con afiliados
SELECT 
    table_name AS view_name
FROM 
    information_schema.views
WHERE 
    table_schema = 'public'
    AND (
        table_name LIKE '%referr%'
        OR table_name LIKE '%affil%'
        OR table_name LIKE '%commission%'
    );

-- 8. Verificar si hay políticas RLS para tablas de afiliados
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
    AND (
        tablename LIKE '%referr%'
        OR tablename LIKE '%affil%'
    );

-- 9. Buscar índices relacionados con afiliados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
    AND (
        tablename LIKE '%referr%'
        OR tablename LIKE '%affil%'
        OR indexname LIKE '%referr%'
        OR indexname LIKE '%affil%'
    );

-- 10. Ver triggers relacionados con afiliados o comisiones
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    trigger_schema = 'public'
    AND (
        trigger_name LIKE '%referr%'
        OR trigger_name LIKE '%affil%'
        OR trigger_name LIKE '%commission%'
        OR event_object_table IN ('users', 'trading_accounts')
    );

-- =====================================================
-- RESULTADO ESPERADO:
-- Este script te mostrará:
-- 1. Todas las tablas relacionadas con afiliados
-- 2. Si existen las tablas esperadas por el código
-- 3. Campos en la tabla users para referidos
-- 4. Funciones RPC relacionadas
-- 5. Vistas, políticas RLS, índices y triggers
-- =====================================================