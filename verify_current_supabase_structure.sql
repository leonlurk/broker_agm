-- =====================================================
-- SCRIPT PARA VERIFICAR ESTRUCTURA ACTUAL DE SUPABASE
-- =====================================================
-- Ejecutar en el SQL Editor de Supabase para ver qué existe
-- =====================================================

-- =====================================================
-- 1. VERIFICAR TODAS LAS TABLAS EXISTENTES
-- =====================================================
SELECT
    '=== TABLAS EXISTENTES EN PUBLIC ===' as info;

SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICAR ESTRUCTURA DE TABLA PROFILES
-- =====================================================
SELECT
    '=== ESTRUCTURA DE TABLA PROFILES ===' as info;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- 3. VERIFICAR COLUMNAS ESPECÍFICAS PARA COPY TRADING Y PAMM
-- =====================================================
SELECT
    '=== VERIFICACIÓN DE COLUMNAS NECESARIAS ===' as info;

SELECT
    'profiles' as tabla,
    'is_master_trader' as columna,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND column_name = 'is_master_trader'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    (SELECT data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_master_trader') as tipo

UNION ALL

SELECT
    'profiles',
    'master_config',
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND column_name = 'master_config'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END,
    (SELECT data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'master_config')

UNION ALL

SELECT
    'profiles',
    'is_pamm_manager',
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND column_name = 'is_pamm_manager'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END,
    (SELECT data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_pamm_manager')

UNION ALL

SELECT
    'profiles',
    'pamm_config',
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND column_name = 'pamm_config'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END,
    (SELECT data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'pamm_config')

UNION ALL

SELECT
    'profiles',
    'performance',
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND column_name = 'performance'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END,
    (SELECT data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'performance');

-- =====================================================
-- 4. VERIFICAR TABLA COPY_RELATIONSHIPS
-- =====================================================
SELECT
    '=== VERIFICACIÓN DE TABLA COPY_RELATIONSHIPS ===' as info;

SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'copy_relationships'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as tabla_copy_relationships;

-- Si existe, mostrar estructura
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'copy_relationships'
ORDER BY ordinal_position;

-- =====================================================
-- 5. VERIFICAR TABLA PAMM_FUNDS
-- =====================================================
SELECT
    '=== VERIFICACIÓN DE TABLA PAMM_FUNDS ===' as info;

SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'pamm_funds'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as tabla_pamm_funds;

-- Si existe, mostrar estructura
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pamm_funds'
ORDER BY ordinal_position;

-- =====================================================
-- 6. VERIFICAR TABLA PAMM_INVESTORS
-- =====================================================
SELECT
    '=== VERIFICACIÓN DE TABLA PAMM_INVESTORS ===' as info;

SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'pamm_investors'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as tabla_pamm_investors;

-- Si existe, mostrar estructura
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pamm_investors'
ORDER BY ordinal_position;

-- =====================================================
-- 7. VERIFICAR TABLA REPLICATION_QUEUE
-- =====================================================
SELECT
    '=== VERIFICACIÓN DE TABLA REPLICATION_QUEUE ===' as info;

SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'replication_queue'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as tabla_replication_queue;

-- Si existe, mostrar estructura
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'replication_queue'
ORDER BY ordinal_position;

-- =====================================================
-- 8. VERIFICAR POLÍTICAS RLS
-- =====================================================
SELECT
    '=== POLÍTICAS RLS EXISTENTES ===' as info;

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'copy_relationships', 'pamm_funds', 'pamm_investors', 'replication_queue')
ORDER BY tablename, policyname;

-- =====================================================
-- 9. VERIFICAR FUNCIONES Y STORED PROCEDURES
-- =====================================================
SELECT
    '=== FUNCIONES/PROCEDURES EXISTENTES ===' as info;

SELECT
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('join_pamm_fund', 'leave_pamm_fund', 'update_updated_at_column')
ORDER BY routine_name;

-- =====================================================
-- 10. VERIFICAR TRIGGERS
-- =====================================================
SELECT
    '=== TRIGGERS EXISTENTES ===' as info;

SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('profiles', 'copy_relationships', 'pamm_funds', 'pamm_investors')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 11. VERIFICAR ÍNDICES
-- =====================================================
SELECT
    '=== ÍNDICES EXISTENTES ===' as info;

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'copy_relationships', 'pamm_funds', 'pamm_investors', 'replication_queue')
ORDER BY tablename, indexname;

-- =====================================================
-- 12. VERIFICAR VISTAS
-- =====================================================
SELECT
    '=== VISTAS EXISTENTES ===' as info;

SELECT
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('v_master_traders_info', 'v_user_investments')
ORDER BY table_name;

-- =====================================================
-- 13. RESUMEN FINAL
-- =====================================================
SELECT
    '=== RESUMEN DE VERIFICACIÓN ===' as info;

SELECT
    'Tablas' as componente,
    COUNT(*) as cantidad
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN ('profiles', 'copy_relationships', 'pamm_funds', 'pamm_investors', 'replication_queue')

UNION ALL

SELECT
    'Políticas RLS',
    COUNT(*)
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'copy_relationships', 'pamm_funds', 'pamm_investors', 'replication_queue')

UNION ALL

SELECT
    'Funciones/Procedures',
    COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('join_pamm_fund', 'leave_pamm_fund', 'update_updated_at_column')

UNION ALL

SELECT
    'Triggers',
    COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('profiles', 'copy_relationships', 'pamm_funds', 'pamm_investors')

UNION ALL

SELECT
    'Vistas',
    COUNT(*)
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('v_master_traders_info', 'v_user_investments');

-- =====================================================
-- FIN DEL SCRIPT DE VERIFICACIÓN
-- =====================================================
SELECT '✅ Verificación completada. Revisa los resultados anteriores.' as mensaje;