-- =====================================================
-- VERIFICAR QUÉ TABLA CONFIGURÓ EL BACKEND
-- =====================================================

-- 1. VER TODOS LOS TRIGGERS EN auth.users (cuando se crea un usuario)
SELECT 
    tgname AS trigger_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE tgrelid = 'auth.users'::regclass;

-- 2. VER EL CÓDIGO DE LAS FUNCIONES QUE SE EJECUTAN AL CREAR USUARIO
SELECT 
    proname AS function_name,
    prosrc AS function_code
FROM pg_proc
WHERE proname LIKE '%user%' 
   OR proname LIKE '%profile%'
   OR proname LIKE '%new_user%'
   OR proname LIKE '%signup%';

-- 3. VER ESTRUCTURA DE AMBAS TABLAS (qué campos tienen)
-- Tabla USERS
SELECT 
    attname AS column_name,
    format_type(atttypid, atttypmod) AS data_type
FROM pg_attribute
WHERE attrelid = 'public.users'::regclass
    AND attnum > 0
    AND NOT attisdropped
ORDER BY attnum;

-- 4. Tabla PROFILES
SELECT 
    attname AS column_name,
    format_type(atttypid, atttypmod) AS data_type
FROM pg_attribute
WHERE attrelid = 'public.profiles'::regclass
    AND attnum > 0
    AND NOT attisdropped
ORDER BY attnum;

-- 5. VER SI HAY FOREIGN KEYS QUE REFERENCIEN auth.users
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS references_table
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.confrelid = 'auth.users'::regclass;

-- 6. VER POLÍTICAS RLS EN CADA TABLA
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('users', 'profiles');

-- 7. VER SI HAY FUNCIONES QUE INSERTEN EN USERS O PROFILES
SELECT 
    proname AS function_name,
    prosrc AS function_code
FROM pg_proc
WHERE prosrc LIKE '%INSERT INTO%users%'
   OR prosrc LIKE '%INSERT INTO%profiles%';

-- 8. VER LA FECHA DE CREACIÓN DE LAS TABLAS (cuál es más reciente)
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN ('users', 'profiles', 'broker_accounts', 'trading_accounts');