-- ============================================
-- AGREGAR COLUMNAS FALTANTES DE FORMA SEGURA
-- Solo agrega si no existen, no modifica lo existente
-- ============================================

-- 1. AGREGAR COLUMNAS A profiles SI NO EXISTEN
-- Columna para balance del broker
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS broker_balance DECIMAL(20, 2) DEFAULT 0.00;

-- Columna para timestamp de última actualización del balance
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS broker_balance_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. AGREGAR COLUMNAS A broker_accounts SI NO EXISTEN
-- Columna updated_at para tracking de cambios
ALTER TABLE broker_accounts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Columna created_at si no existe
ALTER TABLE broker_accounts 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. AGREGAR COLUMNAS A internal_transfers SI NO EXISTEN
-- Columnas para mejor tracking del proceso
ALTER TABLE internal_transfers 
ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false;

ALTER TABLE internal_transfers 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE internal_transfers 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 4. VERIFICAR QUE LAS COLUMNAS SE AGREGARON CORRECTAMENTE
SELECT 'Verificando columnas agregadas a profiles:' as status;
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name LIKE '%broker_balance%';

SELECT 'Verificando columnas agregadas a broker_accounts:' as status;
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name = 'broker_accounts'
AND column_name IN ('updated_at', 'created_at');

SELECT 'Verificando columnas agregadas a internal_transfers:' as status;
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name = 'internal_transfers'
AND column_name IN ('processed', 'processed_at', 'completed_at');

-- 5. CREAR ÍNDICES BÁSICOS SI NO EXISTEN
CREATE INDEX IF NOT EXISTS idx_broker_accounts_user_id 
ON broker_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_internal_transfers_user_id 
ON internal_transfers(user_id);

CREATE INDEX IF NOT EXISTS idx_internal_transfers_status 
ON internal_transfers(status);

-- 6. VERIFICAR ÍNDICES CREADOS
SELECT 'Índices en broker_accounts:' as status;
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'broker_accounts';

SELECT 'Índices en internal_transfers:' as status;
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'internal_transfers';

SELECT 'Columnas faltantes agregadas exitosamente' AS resultado;