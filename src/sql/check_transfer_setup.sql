-- ============================================
-- REVISAR CONFIGURACIÓN DE TRANSFERENCIAS
-- Después de agregar columnas faltantes
-- ============================================

-- 1. Verificar función de transferencia existente
\df create_transfer_request

-- 2. Ver definición de la función (versión simple)
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'create_transfer_request';

-- 3. Verificar tablas relacionadas
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('profiles', 'trading_accounts', 'internal_transfers')
AND column_name IN ('broker_balance', 'balance', 'user_id', 'from_account_id', 'to_account_id')
ORDER BY table_name, ordinal_position;

-- 4. Ver si hay transferencias existentes
SELECT COUNT(*) as total_transfers,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
FROM internal_transfers;

-- 5. Ver balance del usuario actual
SELECT 
    id,
    email,
    broker_balance,
    broker_balance_updated_at
FROM profiles
WHERE id = auth.uid();

-- 6. Ver cuentas MT5 del usuario
SELECT 
    id,
    account_name,
    account_number,
    balance,
    account_type,
    status
FROM trading_accounts
WHERE user_id = auth.uid();

-- 7. Test simple de la función (sin ejecutar cambios reales)
-- Esto te mostrará qué retornaría sin hacer cambios
SELECT jsonb_pretty(
    create_transfer_request(
        'general'::text,
        'Test Balance General'::text,
        'test-id'::text,
        'Test Cuenta MT5'::text,
        0.01::decimal
    )
) as test_result;