-- ========================================
-- CORREGIR SENDER_TYPE DE FORMA SEGURA
-- ========================================

-- 1. Ver qué valores únicos de sender_type existen actualmente
SELECT DISTINCT sender_type, COUNT(*) as cantidad
FROM chat_messages
GROUP BY sender_type
ORDER BY sender_type;

-- 2. Ver el constraint actual
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'chat_messages'::regclass
AND conname LIKE '%sender_type%';

-- 3. Actualizar valores problemáticos a valores válidos
-- Si hay 'bot' cambiar a 'ai'
UPDATE chat_messages 
SET sender_type = 'ai' 
WHERE sender_type = 'bot';

-- Si hay 'assistant' cambiar a 'ai'
UPDATE chat_messages 
SET sender_type = 'ai' 
WHERE sender_type = 'assistant';

-- Si hay 'agent' cambiar a 'human'
UPDATE chat_messages 
SET sender_type = 'human' 
WHERE sender_type = 'agent';

-- Si hay 'flofy' cambiar a 'ai'
UPDATE chat_messages 
SET sender_type = 'ai' 
WHERE sender_type = 'flofy';

-- 4. Ver valores después de la limpieza
SELECT DISTINCT sender_type, COUNT(*) as cantidad
FROM chat_messages
GROUP BY sender_type
ORDER BY sender_type;

-- 5. Ahora sí, eliminar el constraint viejo
ALTER TABLE chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check;

-- 6. Crear nuevo constraint que acepta los valores necesarios
ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_sender_type_check 
CHECK (sender_type IN ('user', 'ai', 'human', 'system', 'flofy'));

-- 7. Verificar que el constraint se actualizó
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'chat_messages'::regclass
AND conname LIKE '%sender_type%';

-- 8. Mostrar resultado final
SELECT 'Constraint actualizado exitosamente' as status,
       'Valores permitidos: user, ai, human, system, flofy' as valores_permitidos;