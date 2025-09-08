-- ========================================
-- SOLUCIÓN DEFINITIVA PARA SENDER_TYPE
-- ========================================

-- 1. Ver la estructura COMPLETA de chat_messages
\d chat_messages

-- 2. Ver el constraint actual EXACTO
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint
WHERE conrelid = 'chat_messages'::regclass
AND conname = 'chat_messages_sender_type_check';

-- 3. FORZAR eliminación del constraint
ALTER TABLE chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check CASCADE;

-- 4. Verificar que se eliminó
SELECT COUNT(*) as constraints_remaining
FROM pg_constraint
WHERE conrelid = 'chat_messages'::regclass
AND conname = 'chat_messages_sender_type_check';

-- 5. Crear constraint nuevo que INCLUYA 'human'
ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_sender_type_check 
CHECK (sender_type IN ('user', 'ai', 'human', 'system', 'flofy', 'bot', 'assistant'));

-- 6. Verificar el nuevo constraint
SELECT pg_get_constraintdef(oid) as nuevo_constraint
FROM pg_constraint
WHERE conrelid = 'chat_messages'::regclass
AND conname = 'chat_messages_sender_type_check';

-- 7. Probar que ahora funciona con 'human'
INSERT INTO chat_messages (
    conversation_id, 
    sender_type, 
    sender_name,
    message,
    message_type,
    metadata
)
SELECT 
    id as conversation_id,
    'human' as sender_type,
    'Test Operator' as sender_name,
    'Test message from human' as message,
    'text' as message_type,
    '{"test": true}'::jsonb as metadata
FROM chat_conversations
LIMIT 1
RETURNING id, sender_type, message;

-- 8. Limpiar el test
DELETE FROM chat_messages 
WHERE message = 'Test message from human'
AND metadata->>'test' = 'true';

-- 9. Confirmar valores permitidos
SELECT 'ÉXITO: Constraint actualizado' as status,
       'Valores permitidos: user, ai, human, system, flofy, bot, assistant' as sender_types;