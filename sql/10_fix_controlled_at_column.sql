-- ========================================
-- AGREGAR COLUMNA CONTROLLED_AT FALTANTE
-- ========================================

-- 1. Verificar estructura actual de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_conversations' 
ORDER BY ordinal_position;

-- 2. Agregar columna controlled_at si no existe
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS controlled_at TIMESTAMPTZ;

-- 3. Verificar que la columna se agregó correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_conversations' 
AND column_name = 'controlled_at';

-- 4. Actualizar registros existentes que tengan is_human_controlled = true
UPDATE chat_conversations 
SET controlled_at = NOW() 
WHERE is_human_controlled = true 
AND controlled_at IS NULL;

-- 5. Verificar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_conversations'
ORDER BY ordinal_position;