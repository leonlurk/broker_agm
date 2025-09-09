-- ============================================
-- REVISAR FUNCIÓN EXISTENTE DE TRANSFERENCIAS
-- ============================================

-- 1. Ver la definición actual de la función
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_transfer_request'
AND routine_schema = 'public';

-- 2. Ver los parámetros de la función
SELECT 
    parameter_name,
    data_type,
    parameter_mode,
    ordinal_position
FROM information_schema.parameters
WHERE specific_name LIKE 'create_transfer_request%'
ORDER BY ordinal_position;

-- 3. Verificar si la tabla trading_accounts tiene columna balance
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'trading_accounts'
AND column_name = 'balance';

-- 4. Ver estructura de internal_transfers
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'internal_transfers'
ORDER BY ordinal_position;

-- 5. Verificar políticas RLS en trading_accounts
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
WHERE tablename = 'trading_accounts';

-- 6. Probar la función actual con datos de ejemplo (sin ejecutar cambios)
-- Esto muestra qué retornaría la función sin hacer cambios reales
SELECT create_transfer_request(
    'general',
    'Balance General TEST',
    'test-account-id',
    'Cuenta MT5 TEST',
    100.00
) AS test_result;

-- 7. Ver si hay índices en trading_accounts
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'trading_accounts';

-- 8. Verificar el balance actual del usuario (ejemplo)
SELECT 
    id,
    broker_balance,
    broker_balance_updated_at
FROM profiles
WHERE id = auth.uid();

-- 9. Ver cuentas trading_accounts del usuario
SELECT 
    id,
    account_name,
    account_number,
    balance,
    account_type,
    status
FROM trading_accounts
WHERE user_id = auth.uid();