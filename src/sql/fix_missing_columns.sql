-- ============================================
-- AGREGAR COLUMNAS FALTANTES
-- Soluciona errores de columnas que no existen
-- ============================================

-- 1. Primero verificar qué columnas existen en profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('broker_balance', 'broker_balance_updated_at')
ORDER BY ordinal_position;

-- 2. Agregar columna broker_balance si no existe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS broker_balance DECIMAL(20, 2) DEFAULT 0.00;

-- 3. Agregar columna broker_balance_updated_at si no existe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS broker_balance_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Verificar que se agregaron correctamente
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name LIKE '%broker_balance%';

-- 5. Ahora sí verificar la función existente (sin usar broker_balance_updated_at si no existe)
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'create_transfer_request'
AND routine_schema = 'public';

-- 6. Ver los parámetros de la función
SELECT 
    parameter_name,
    data_type,
    parameter_mode,
    ordinal_position
FROM information_schema.parameters
WHERE specific_name LIKE 'create_transfer_request%'
ORDER BY ordinal_position;

-- 7. Verificar estructura de internal_transfers
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'internal_transfers'
LIMIT 10;

-- 8. Verificar estructura de trading_accounts
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'trading_accounts'
AND column_name IN ('balance', 'user_id', 'account_name', 'account_number', 'updated_at')
ORDER BY ordinal_position;

-- 9. Si trading_accounts no tiene balance, agregarla
ALTER TABLE trading_accounts 
ADD COLUMN IF NOT EXISTS balance DECIMAL(20, 2) DEFAULT 0.00;

-- 10. Verificar el balance actual del usuario (sin broker_balance_updated_at si no existe)
SELECT 
    id,
    broker_balance
FROM profiles
WHERE id = auth.uid();

-- 11. Ver todas las columnas de profiles para entender la estructura
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;