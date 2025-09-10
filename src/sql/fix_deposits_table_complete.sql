-- ============================================
-- ARREGLAR TABLA DEPOSITS COMPLETAMENTE
-- Agregar TODAS las columnas faltantes
-- ============================================

-- 1. Ver qué columnas YA EXISTEN en deposits
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'deposits'
ORDER BY ordinal_position;

-- 2. Agregar TODAS las columnas que puedan faltar
ALTER TABLE deposits 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS crypto_currency VARCHAR(10),
ADD COLUMN IF NOT EXISTS crypto_network VARCHAR(50),
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS transaction_hash TEXT,
ADD COLUMN IF NOT EXISTS account_id TEXT,
ADD COLUMN IF NOT EXISTS account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payroll_data JSONB;

-- 3. Verificar que todas las columnas necesarias existen ahora
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deposits'
ORDER BY ordinal_position;

-- 4. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_account_id ON deposits(account_id);

-- 5. Mensaje de confirmación
SELECT 'Tabla deposits completamente actualizada' AS resultado;