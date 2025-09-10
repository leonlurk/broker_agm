-- ============================================
-- AGREGAR COLUMNAS FALTANTES A TABLA DEPOSITS
-- Para soportar depósitos de criptomonedas
-- ============================================

-- 1. Ver estructura actual de deposits
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deposits'
ORDER BY ordinal_position;

-- 2. Agregar columnas faltantes para crypto
ALTER TABLE deposits 
ADD COLUMN IF NOT EXISTS crypto_currency VARCHAR(10),
ADD COLUMN IF NOT EXISTS crypto_network VARCHAR(50),
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS transaction_hash TEXT;

-- 3. Agregar columna para datos de Payroll si no existe
ALTER TABLE deposits
ADD COLUMN IF NOT EXISTS payroll_data JSONB;

-- 4. Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'deposits'
AND column_name IN ('crypto_currency', 'crypto_network', 'wallet_address', 'transaction_hash', 'payroll_data')
ORDER BY ordinal_position;

-- 5. Crear índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_deposits_transaction_hash 
ON deposits(transaction_hash) 
WHERE transaction_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deposits_user_status 
ON deposits(user_id, status);

-- 6. Mensaje de confirmación
SELECT 'Columnas de crypto agregadas exitosamente a deposits' AS resultado;