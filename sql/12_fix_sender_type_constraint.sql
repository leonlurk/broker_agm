-- ========================================
-- CORREGIR CONSTRAINT DE SENDER_TYPE
-- ========================================

-- 1. Ver el constraint actual
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'chat_messages'::regclass
AND conname LIKE '%sender_type%';

-- 2. Eliminar el constraint viejo si existe
ALTER TABLE chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check;

-- 3. Crear nuevo constraint que acepta 'user', 'ai', y 'human'
ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_sender_type_check 
CHECK (sender_type IN ('user', 'ai', 'human', 'system'));

-- 4. Verificar que el constraint se actualizó
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'chat_messages'::regclass
AND conname LIKE '%sender_type%';

-- 5. Probar que ahora funciona
INSERT INTO chat_messages (conversation_id, sender_type, message)
VALUES (
    (SELECT id FROM chat_conversations LIMIT 1),
    'human',
    'Test message from human operator'
)
RETURNING *;

-- 6. Limpiar el test
DELETE FROM chat_messages 
WHERE message = 'Test message from human operator';

-- 7. Mostrar valores permitidos
SELECT 'Valores permitidos para sender_type:' as info, 'user, ai, human, system' as valores;