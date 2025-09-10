-- ============================================
-- AGREGAR COLUMNAS FALTANTES PARA DEPOSITS
-- ============================================

-- 1. Agregar columna payroll_verified si no existe
ALTER TABLE deposits 
ADD COLUMN IF NOT EXISTS payroll_verified BOOLEAN DEFAULT false;

-- 2. Verificar que se agregó
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'deposits'
AND column_name = 'payroll_verified';

-- 3. Ver la definición de la función RPC para entender qué espera
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'create_deposit_request';

-- 4. Mensaje de confirmación
SELECT 'Columna payroll_verified agregada' AS resultado;