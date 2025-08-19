-- SQL para ver la estructura actual de todas las tablas en Supabase
-- Ejecuta este script para obtener información completa sobre las tablas existentes

-- 1. Listar todas las tablas públicas
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Ver estructura de la tabla users
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Ver estructura de la tabla payment_methods
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'payment_methods'
ORDER BY ordinal_position;

-- 4. Ver estructura de la tabla kyc_verifications
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'kyc_verifications'
ORDER BY ordinal_position;

-- 5. Ver estructura de la tabla trading_accounts (si existe)
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'trading_accounts'
ORDER BY ordinal_position;

-- 6. Ver todas las restricciones (foreign keys, primary keys, etc.)
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- 7. Ver índices existentes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 8. Ver políticas RLS (Row Level Security)
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
ORDER BY tablename, policyname;

-- 9. Verificar si existen tablas de transacciones o solicitudes
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (
        table_name LIKE '%transaction%'
        OR table_name LIKE '%withdrawal%'
        OR table_name LIKE '%deposit%'
        OR table_name LIKE '%transfer%'
        OR table_name LIKE '%request%'
        OR table_name LIKE '%solicitud%'
    )
ORDER BY table_name;