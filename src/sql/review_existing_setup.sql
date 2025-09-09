-- ============================================
-- REVISAR CONFIGURACIÓN EXISTENTE COMPLETA
-- Sin hacer cambios, solo verificar el estado actual
-- ============================================

-- 1. VERIFICAR TABLAS QUE REALMENTE EXISTEN
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('broker_accounts', 'profiles', 'internal_transfers', 'deposits', 'withdrawals')
ORDER BY table_name;

-- 2. VER ESTRUCTURA COMPLETA DE broker_accounts
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'broker_accounts'
ORDER BY ordinal_position;

-- 3. VER ESTRUCTURA DE profiles (columnas relacionadas con balance)
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND (column_name LIKE '%balance%' OR column_name IN ('id', 'user_id'))
ORDER BY ordinal_position;

-- 4. VER ESTRUCTURA DE internal_transfers
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'internal_transfers'
ORDER BY ordinal_position;

-- 5. VER FUNCIONES EXISTENTES RELACIONADAS CON TRANSFERENCIAS
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    is_deterministic
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%transfer%'
ORDER BY routine_name;

-- 6. VER PARÁMETROS DE LA FUNCIÓN create_transfer_request SI EXISTE
SELECT 
    parameter_name,
    data_type,
    parameter_mode,
    ordinal_position
FROM information_schema.parameters
WHERE specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'create_transfer_request'
)
ORDER BY ordinal_position;

-- 7. VER CÓDIGO DE LA FUNCIÓN create_transfer_request SI EXISTE
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'create_transfer_request'
LIMIT 1;

-- 8. VERIFICAR POLÍTICAS RLS EXISTENTES EN broker_accounts
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
WHERE tablename = 'broker_accounts';

-- 9. VERIFICAR SI RLS ESTÁ HABILITADO EN broker_accounts
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'broker_accounts';

-- 10. VER ÍNDICES EXISTENTES EN broker_accounts
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'broker_accounts';

-- 11. VERIFICAR DATOS DE EJEMPLO EN broker_accounts (solo estructura, sin datos sensibles)
SELECT 
    COUNT(*) as total_accounts,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN balance > 0 THEN 1 END) as accounts_with_balance
FROM broker_accounts;

-- 12. VERIFICAR DATOS DE EJEMPLO EN internal_transfers
SELECT 
    COUNT(*) as total_transfers,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transfers,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transfers
FROM internal_transfers;

-- 13. VERIFICAR QUE COLUMNAS broker_balance EXISTEN EN profiles
SELECT 
    COUNT(CASE WHEN column_name = 'broker_balance' THEN 1 END) as has_broker_balance,
    COUNT(CASE WHEN column_name = 'broker_balance_updated_at' THEN 1 END) as has_broker_balance_updated_at
FROM information_schema.columns
WHERE table_name = 'profiles';