-- VERIFICAR CAMPOS DE BALANCE EN TODAS LAS TABLAS RELEVANTES

-- 1. Ver estructura de broker_accounts
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'broker_accounts'
AND column_name LIKE '%balance%'
ORDER BY ordinal_position;

-- 2. Ver TODOS los campos de broker_accounts
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'broker_accounts'
ORDER BY ordinal_position;

-- 3. Ver estructura de account_balances
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'account_balances'
ORDER BY ordinal_position;

-- 4. Ver la definición actual de create_withdrawal_request
\sf create_withdrawal_request