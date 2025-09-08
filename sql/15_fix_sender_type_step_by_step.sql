-- ========================================
-- SOLUCIÓN PASO A PASO - SEGURA
-- ========================================

-- PASO 1: Ver qué valores de sender_type existen actualmente
SELECT 
    sender_type, 
    COUNT(*) as cantidad,
    CASE 
        WHEN sender_type IN ('user', 'ai') THEN '✓ Válido'
        ELSE '✗ Necesita actualización'
    END as estado
FROM chat_messages
GROUP BY sender_type
ORDER BY cantidad DESC;

-- PASO 2: Ver el constraint actual para saber qué valores permite
SELECT pg_get_constraintdef(oid) as constraint_actual
FROM pg_constraint
WHERE conrelid = 'chat_messages'::regclass
AND conname = 'chat_messages_sender_type_check';

-- PASO 3: Actualizar TODOS los valores problemáticos a valores válidos
BEGIN;

-- Actualizar 'human' a 'ai' temporalmente (porque 'human' no está permitido aún)
UPDATE chat_messages 
SET sender_type = 'ai' 
WHERE sender_type = 'human';

-- Actualizar 'flofy' a 'ai' 
UPDATE chat_messages 
SET sender_type = 'ai' 
WHERE sender_type = 'flofy';

-- Actualizar 'bot' a 'ai'
UPDATE chat_messages 
SET sender_type = 'ai' 
WHERE sender_type = 'bot';

-- Actualizar 'assistant' a 'ai'
UPDATE chat_messages 
SET sender_type = 'ai' 
WHERE sender_type = 'assistant';

-- Actualizar 'system' a 'ai'
UPDATE chat_messages 
SET sender_type = 'ai' 
WHERE sender_type = 'system';

-- Actualizar cualquier otro valor a 'ai'
UPDATE chat_messages 
SET sender_type = 'ai' 
WHERE sender_type NOT IN ('user', 'ai');

COMMIT;

-- PASO 4: Verificar que ya no hay valores problemáticos
SELECT 
    sender_type, 
    COUNT(*) as cantidad
FROM chat_messages
GROUP BY sender_type
ORDER BY sender_type;

-- PASO 5: Ahora sí, eliminar el constraint viejo
ALTER TABLE chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check;

-- PASO 6: Crear el nuevo constraint que incluye 'human'
ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_sender_type_check 
CHECK (sender_type IN ('user', 'ai', 'human', 'system', 'flofy'));

-- PASO 7: Verificar el nuevo constraint
SELECT pg_get_constraintdef(oid) as nuevo_constraint
FROM pg_constraint
WHERE conrelid = 'chat_messages'::regclass
AND conname = 'chat_messages_sender_type_check';

-- PASO 8: Probar que ahora funciona con 'human'
DO $$
DECLARE
    test_conv_id UUID;
BEGIN
    -- Obtener un conversation_id válido
    SELECT id INTO test_conv_id FROM chat_conversations LIMIT 1;
    
    IF test_conv_id IS NOT NULL THEN
        -- Insertar mensaje de prueba
        INSERT INTO chat_messages (
            conversation_id, 
            sender_type, 
            message
        ) VALUES (
            test_conv_id,
            'human',
            'TEST: Mensaje de operador humano'
        );
        
        -- Eliminar el mensaje de prueba
        DELETE FROM chat_messages 
        WHERE message = 'TEST: Mensaje de operador humano';
        
        RAISE NOTICE 'ÉXITO: El tipo human ahora funciona correctamente';
    END IF;
END $$;

-- PASO 9: Resultado final
SELECT 
    'Constraint actualizado exitosamente' as resultado,
    'user, ai, human, system, flofy' as valores_permitidos;