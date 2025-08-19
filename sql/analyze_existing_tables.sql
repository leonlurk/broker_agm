-- SQL para analizar las estructuras de las tablas de transacciones existentes
-- Ejecuta este script para ver qué columnas tienen estas tablas

-- 1. Ver estructura de la tabla deposits
SELECT 
    'deposits' as table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'deposits'
ORDER BY ordinal_position;

-- 2. Ver estructura de la tabla withdrawals
SELECT 
    'withdrawals' as table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'withdrawals'
ORDER BY ordinal_position;

-- 3. Ver estructura de la tabla transactions
SELECT 
    'transactions' as table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'transactions'
ORDER BY ordinal_position;

-- 4. Ver estructura de la tabla broker_transactions
SELECT 
    'broker_transactions' as table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'broker_transactions'
ORDER BY ordinal_position;

-- 5. Ver estructura de la tabla crypto_transactions
SELECT 
    'crypto_transactions' as table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'crypto_transactions'
ORDER BY ordinal_position;

-- 6. Contar registros en cada tabla
SELECT 'deposits' as table_name, COUNT(*) as record_count FROM deposits
UNION ALL
SELECT 'withdrawals', COUNT(*) FROM withdrawals
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'broker_transactions', COUNT(*) FROM broker_transactions
UNION ALL
SELECT 'crypto_transactions', COUNT(*) FROM crypto_transactions;