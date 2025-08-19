-- SQL para verificar qué columnas realmente existen en las tablas de transacciones
-- Ejecuta este script primero para ver la estructura real

-- 1. Ver TODAS las columnas de la tabla deposits
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'deposits'
ORDER BY ordinal_position;

-- 2. Ver TODAS las columnas de la tabla withdrawals
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'withdrawals'
ORDER BY ordinal_position;

-- 3. Ver TODAS las columnas de la tabla transactions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'transactions'
ORDER BY ordinal_position;

-- 4. Ver TODAS las columnas de la tabla broker_transactions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'broker_transactions'
ORDER BY ordinal_position;

-- 5. Ver TODAS las columnas de la tabla crypto_transactions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'crypto_transactions'
ORDER BY ordinal_position;

-- 6. Verificar si hay alguna columna que haga referencia a usuarios
SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN ('deposits', 'withdrawals', 'transactions', 'broker_transactions', 'crypto_transactions')
    AND (
        column_name LIKE '%user%' 
        OR column_name LIKE '%client%' 
        OR column_name LIKE '%customer%'
        OR column_name LIKE '%account%'
        OR column_name = 'email'
        OR column_name = 'id'
    )
ORDER BY table_name, column_name;