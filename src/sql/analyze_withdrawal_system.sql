-- ANALIZAR TODO EL SISTEMA DE RETIROS SIN MODIFICAR NADA
-- Este script solo CONSULTA información, no modifica nada

-- 1. Ver todas las funciones create_withdrawal_request existentes
SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_withdrawal_request'
AND n.nspname = 'public';

-- 2. Ver la estructura de la tabla broker_accounts
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'broker_accounts'
ORDER BY ordinal_position;

-- 3. Ver si existe una columna broker_balance en alguna tabla
SELECT 
    table_name,
    column_name, 
    data_type
FROM information_schema.columns
WHERE column_name = 'broker_balance'
AND table_schema = 'public';

-- 4. Ver la estructura completa de withdrawals (resumida)
SELECT 
    column_name, 
    data_type,
    CASE 
        WHEN column_name IN ('crypto_address', 'crypto_network', 'wallet_address', 'network') 
        THEN '⚠️ CAMPO IMPORTANTE'
        ELSE ''
    END as nota
FROM information_schema.columns
WHERE table_name = 'withdrawals'
AND column_name IN (
    'id', 'user_id', 'amount', 'status',
    'crypto_address', 'crypto_network', 
    'wallet_address', 'network',
    'account_id', 'account_name'
)
ORDER BY ordinal_position;

-- 5. Ver si hay alguna vista o tabla con balance de usuarios
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
    table_name LIKE '%balance%' 
    OR table_name LIKE '%account%'
    OR table_name LIKE '%wallet%'
)
ORDER BY table_name;