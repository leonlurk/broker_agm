-- ========================================
-- DESACTIVAR RLS TEMPORALMENTE PARA PRUEBAS
-- ========================================
-- ADVERTENCIA: Esto desactiva toda la seguridad de las tablas
-- Solo usar para desarrollo/pruebas

-- Desactivar RLS completamente en las tablas de chat
ALTER TABLE chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_feedback DISABLE ROW LEVEL SECURITY;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'RLS DESACTIVADO en tablas de chat. ADVERTENCIA: Esto es solo para desarrollo/pruebas.';
END $$;

-- Para verificar el estado de RLS:
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM 
    pg_tables
WHERE 
    tablename IN ('chat_conversations', 'chat_messages', 'chat_message_feedback');

-- ========================================
-- ALTERNATIVA: Si prefieres mantener RLS pero con políticas permisivas
-- ========================================
-- Descomenta las siguientes líneas si quieres volver a activar RLS con políticas muy permisivas:

/*
-- Reactivar RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_feedback ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Allow all for chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Allow all for chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow all for chat_message_feedback" ON chat_message_feedback;

-- Crear una política única que permite TODO a TODOS
CREATE POLICY "Allow all for chat_conversations"
ON chat_conversations
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for chat_messages"
ON chat_messages
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for chat_message_feedback"
ON chat_message_feedback
FOR ALL
TO public
USING (true)
WITH CHECK (true);
*/