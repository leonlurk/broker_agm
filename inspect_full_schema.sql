-- =====================================================
-- SCRIPT COMPLETO PARA INSPECCIONAR TODA LA ESTRUCTURA
-- =====================================================

-- 1. LISTAR TODAS LAS TABLAS
-- =====================================================
SELECT 
    schemaname as schema,
    tablename as table_name,
    tableowner as owner
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;

-- 2. ESTRUCTURA DETALLADA DE TODAS LAS TABLAS
-- =====================================================
SELECT 
    t.table_schema,
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.column_default,
    c.is_nullable,
    c.ordinal_position
FROM information_schema.tables t
JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY t.table_schema, t.table_name, c.ordinal_position;

-- 3. TODAS LAS CONSTRAINTS (PRIMARY KEYS, FOREIGN KEYS, UNIQUE, CHECK)
-- =====================================================
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.check_constraints cc
    ON cc.constraint_name = tc.constraint_name
    AND cc.constraint_schema = tc.table_schema
WHERE tc.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_type;

-- 4. TODOS LOS ÍNDICES
-- =====================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, indexname;

-- 5. TODAS LAS FUNCIONES Y TRIGGERS
-- =====================================================
-- Funciones
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as result_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name, function_name;

-- Triggers
SELECT 
    trigger_schema,
    trigger_name,
    event_object_schema,
    event_object_table,
    action_statement,
    action_orientation,
    action_timing,
    array_to_string(array_agg(event_manipulation), ',') as events
FROM information_schema.triggers
WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema')
GROUP BY 
    trigger_schema,
    trigger_name,
    event_object_schema,
    event_object_table,
    action_statement,
    action_orientation,
    action_timing
ORDER BY event_object_schema, event_object_table, trigger_name;

-- 6. POLÍTICAS RLS (Row Level Security)
-- =====================================================
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
ORDER BY schemaname, tablename, policyname;

-- 7. VISTAS
-- =====================================================
SELECT 
    table_schema,
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;

-- 8. SECUENCIAS
-- =====================================================
SELECT 
    sequence_schema,
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences
WHERE sequence_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY sequence_schema, sequence_name;

-- 9. TIPOS DE DATOS PERSONALIZADOS
-- =====================================================
SELECT 
    n.nspname as schema_name,
    t.typname as type_name,
    t.typtype as type_type,
    CASE t.typtype
        WHEN 'c' THEN 'composite'
        WHEN 'd' THEN 'domain'
        WHEN 'e' THEN 'enum'
        WHEN 'r' THEN 'range'
        ELSE 'other'
    END as type_category
FROM pg_type t
LEFT JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND t.typname NOT LIKE '\_%'
ORDER BY schema_name, type_name;

-- 10. EXTENSIONES INSTALADAS
-- =====================================================
SELECT 
    extname as extension_name,
    extversion as version,
    extnamespace::regnamespace as schema
FROM pg_extension
ORDER BY extname;

-- 11. RESUMEN DE TABLAS CON CONTEO DE REGISTROS
-- =====================================================
DO $$
DECLARE
    r RECORD;
    v_count INTEGER;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    LOOP
        EXECUTE 'SELECT COUNT(*) FROM ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) INTO v_count;
        RAISE NOTICE 'Table %.%: % rows', r.schemaname, r.tablename, v_count;
    END LOOP;
END $$;

-- 12. PERMISOS Y PRIVILEGIOS
-- =====================================================
SELECT 
    grantor,
    grantee,
    table_schema,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name, grantee, privilege_type;