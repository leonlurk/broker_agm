-- ====================================
-- VERIFICAR ESTRUCTURA REAL DE ESTE SUPABASE
-- ====================================

-- 1. Listar TODAS las tablas que existen
SELECT 
    'TABLAS EXISTENTES:' as info;
    
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Buscar específicamente tablas de usuarios/perfiles
SELECT 
    '-------------------' as separator,
    'TABLAS DE USUARIOS/PERFILES:' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND (
        table_name LIKE '%user%' 
        OR table_name LIKE '%profile%' 
        OR table_name LIKE '%member%'
        OR table_name LIKE '%person%'
        OR table_name LIKE '%account%'
    )
ORDER BY table_name, ordinal_position
LIMIT 50;

-- 3. Ver si existe la función handle_new_user (que veo que existe)
SELECT 
    '-------------------' as separator,
    'FUNCIÓN handle_new_user:' as info;

SELECT 
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 4. Buscar tablas de pagos
SELECT 
    '-------------------' as separator,
    'TABLAS DE PAGOS:' as info;

SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (
        table_name LIKE '%payment%' 
        OR table_name LIKE '%method%'
        OR table_name LIKE '%pago%'
        OR table_name LIKE '%wallet%'
    );

-- 5. Ver estructura de auth.users (siempre existe)
SELECT 
    '-------------------' as separator,
    'ESTRUCTURA AUTH.USERS:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
    AND table_name = 'users'
ORDER BY ordinal_position
LIMIT 20;

-- 6. Ver todos los buckets de storage
SELECT 
    '-------------------' as separator,
    'BUCKETS DE STORAGE:' as info;

SELECT 
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

-- 7. Verificar qué trigger ejecuta handle_new_user
SELECT 
    '-------------------' as separator,
    'TRIGGERS:' as info;

SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    OR action_statement LIKE '%handle_new_user%';