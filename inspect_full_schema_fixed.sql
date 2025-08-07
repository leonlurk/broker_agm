-- =====================================================
-- SCRIPT COMPLETO PARA INSPECCIONAR TODA LA ESTRUCTURA
-- =====================================================

-- 1. LISTAR TODAS LAS TABLAS
-- =====================================================
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY table_schema, table_name;

-- 2. ESTRUCTURA DETALLADA DE TODAS LAS TABLAS CON COLUMNAS
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
WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY t.table_schema, t.table_name, c.ordinal_position;

-- 3. TODAS LAS CONSTRAINTS (PRIMARY KEYS, FOREIGN KEYS, UNIQUE, CHECK)
-- =====================================================
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN ccu.table_name
        ELSE NULL
    END AS foreign_table_name,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN ccu.column_name
        ELSE NULL
    END AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_type, tc.constraint_name;

-- 4. TODOS LOS ÍNDICES
-- =====================================================
SELECT 
    n.nspname AS schema_name,
    t.relname AS table_name,
    i.relname AS index_name,
    a.attname AS column_name,
    ix.indisunique AS is_unique,
    ix.indisprimary AS is_primary
FROM pg_index ix
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY n.nspname, t.relname, i.relname;

-- 5. TODAS LAS FUNCIONES
-- =====================================================
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as result_type,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc as function_body
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY n.nspname, p.proname;

-- 6. TODOS LOS TRIGGERS
-- =====================================================
SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    t.tgname AS trigger_name,
    p.proname AS function_name,
    CASE t.tgtype::integer & 2
        WHEN 0 THEN 'AFTER'
        ELSE 'BEFORE'
    END AS trigger_timing,
    CASE 
        WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
    END AS trigger_event
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND NOT t.tgisinternal
ORDER BY n.nspname, c.relname, t.tgname;

-- 7. POLÍTICAS RLS (Row Level Security)
-- =====================================================
SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    pol.polname AS policy_name,
    pol.polpermissive AS is_permissive,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression,
    r.rolname AS role_name
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_roles r ON r.oid = ANY(pol.polroles)
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY n.nspname, c.relname, pol.polname;

-- 8. VERIFICAR SI RLS ESTÁ HABILITADO EN CADA TABLA
-- =====================================================
SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND c.relkind = 'r'
ORDER BY n.nspname, c.relname;

-- 9. EXTENSIONES INSTALADAS
-- =====================================================
SELECT 
    extname AS extension_name,
    extversion AS version,
    n.nspname AS schema_name
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY extname;

-- 10. CONTAR REGISTROS EN CADA TABLA (ejecutar por separado)
-- =====================================================
-- Nota: Este query genera los comandos SELECT COUNT, debes ejecutar cada uno por separado
SELECT 
    'SELECT ''' || table_schema || '.' || table_name || ''' AS table_name, COUNT(*) AS row_count FROM ' || 
    table_schema || '.' || table_name || ';' AS count_query
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;