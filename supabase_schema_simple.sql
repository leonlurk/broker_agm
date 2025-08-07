-- =====================================================
-- CONSULTAS SIMPLES PARA SUPABASE
-- =====================================================

-- 1. VER TODAS LAS TABLAS EN EL ESQUEMA PUBLIC
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. VER TODAS LAS TABLAS EN EL ESQUEMA AUTH
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- 3. VER ESTRUCTURA DE LA TABLA PROFILES
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. VER ESTRUCTURA DE LA TABLA USERS (si existe)
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 5. VER ESTRUCTURA DE LA TABLA TRADING_ACCOUNTS
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'trading_accounts'
ORDER BY ordinal_position;

-- 6. VER TODAS LAS CONSTRAINTS DE LA TABLA PROFILES
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles';

-- 7. VER CONSTRAINTS UNIQUE EN PROFILES
SELECT 
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
    AND tc.constraint_type = 'UNIQUE';

-- 8. VER TODOS LOS TRIGGERS EN LA TABLA AUTH.USERS
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
    AND event_object_schema = 'auth';

-- 9. VER POLÍTICAS RLS EN PROFILES
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 10. VERIFICAR SI EXISTE CONSTRAINT UNIQUE EN USERNAME
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
    AND contype = 'u';  -- 'u' for UNIQUE

-- 11. VER TODOS LOS ÍNDICES EN PROFILES
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'profiles';

-- 12. CONTAR REGISTROS EN CADA TABLA
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'trading_accounts', COUNT(*) FROM trading_accounts
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;

-- 13. VER FUNCIONES QUE SE EJECUTAN EN TRIGGERS
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE proname LIKE '%user%' 
    OR proname LIKE '%profile%'
    OR proname LIKE '%handle%';

-- 14. VER SI HAY USUARIOS CON USERNAME 'mrlurk'
SELECT id, username, email, created_at 
FROM profiles 
WHERE username = 'mrlurk';

-- 15. VER PRIMEROS 5 REGISTROS DE PROFILES
SELECT id, username, email, role, status, created_at 
FROM profiles 
LIMIT 5;