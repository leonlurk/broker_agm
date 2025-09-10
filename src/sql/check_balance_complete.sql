-- VERIFICAR CAMPOS DE BALANCE Y FUNCIÓN DE RETIROS

-- 1. Ver TODOS los campos de broker_accounts para encontrar el balance general
SELECT 
    column_name, 
    data_type,
    CASE 
        WHEN column_name LIKE '%balance%' THEN '⚠️ CAMPO DE BALANCE'
        WHEN column_name LIKE '%broker%' THEN '⚠️ CAMPO BROKER'
        ELSE ''
    END as nota
FROM information_schema.columns
WHERE table_name = 'broker_accounts'
ORDER BY ordinal_position;

-- 2. Ver definición de la función create_withdrawal_request existente
SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_withdrawal_request'
AND n.nspname = 'public';

-- 3. Buscar específicamente campos que puedan ser el balance general
SELECT 
    table_name,
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
    column_name LIKE '%broker_balance%'
    OR column_name LIKE '%general_balance%'
    OR column_name LIKE '%wallet_balance%'
    OR column_name LIKE '%total_balance%'
)
ORDER BY table_name, column_name;