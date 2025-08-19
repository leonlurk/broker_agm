-- ====================================
-- SCRIPT PARA VERIFICAR LA ESTRUCTURA ACTUAL DE SUPABASE
-- ====================================

-- 1. Listar TODAS las tablas en el schema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Buscar tablas que puedan ser de perfiles/usuarios
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
        OR table_name LIKE '%usuario%'
        OR table_name LIKE '%perfil%'
        OR table_name LIKE '%member%'
        OR table_name LIKE '%account%'
    )
ORDER BY table_name, ordinal_position;

-- 3. Ver la estructura de la tabla auth.users (siempre existe en Supabase)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'auth' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Verificar si existe alguna tabla relacionada con métodos de pago
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

-- 5. Verificar qué buckets de storage existen
SELECT * FROM storage.buckets;

-- 6. Verificar si hay algún trigger que cree perfiles automáticamente
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 7. Buscar funciones que puedan estar creando perfiles
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND (
        routine_name LIKE '%profile%'
        OR routine_name LIKE '%user%'
    );