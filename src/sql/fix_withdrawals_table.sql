-- Agregar columnas faltantes a la tabla withdrawals
-- Ejecutar este script en Supabase SQL Editor

-- Agregar columna wallet_address si no existe
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Agregar columna network si no existe
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS network TEXT;

-- Agregar columna crypto_currency si no existe
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS crypto_currency TEXT;

-- Agregar columna exchange_rate si no existe
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10, 4) DEFAULT 1.0;

-- Agregar columna fee si no existe
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS fee DECIMAL(10, 2) DEFAULT 0;

-- Agregar columna net_amount si no existe
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10, 2);

-- Agregar columna payment_method_id si no existe
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS payment_method_id UUID;

-- Agregar columna notes si no existe
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'withdrawals' 
ORDER BY ordinal_position;