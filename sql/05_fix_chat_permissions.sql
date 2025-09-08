-- ========================================
-- FIX PERMISOS PARA SISTEMA DE CHAT
-- ========================================
-- Habilita INSERT, SELECT, UPDATE para usuarios anónimos y autenticados

-- Primero, eliminar políticas existentes que puedan estar causando conflicto
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can create messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can create feedback" ON chat_message_feedback;
DROP POLICY IF EXISTS "Users can view feedback" ON chat_message_feedback;

-- Habilitar RLS en las tablas
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_feedback ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS PARA chat_conversations
-- ========================================

-- Permitir INSERT para todos (anónimos y autenticados)
CREATE POLICY "Anyone can create conversations"
ON chat_conversations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir SELECT para todos
CREATE POLICY "Anyone can view conversations"
ON chat_conversations FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir UPDATE para todos (para actualizar last_activity, is_human_controlled, etc.)
CREATE POLICY "Anyone can update conversations"
ON chat_conversations FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ========================================
-- POLÍTICAS PARA chat_messages
-- ========================================

-- Permitir INSERT para todos
CREATE POLICY "Anyone can create messages"
ON chat_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir SELECT para todos
CREATE POLICY "Anyone can view messages"
ON chat_messages FOR SELECT
TO anon, authenticated
USING (true);

-- ========================================
-- POLÍTICAS PARA chat_message_feedback
-- ========================================

-- Permitir INSERT para todos
CREATE POLICY "Anyone can create feedback"
ON chat_message_feedback FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir SELECT para todos
CREATE POLICY "Anyone can view feedback"
ON chat_message_feedback FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir UPDATE para actualizar feedback existente
CREATE POLICY "Anyone can update feedback"
ON chat_message_feedback FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ========================================
-- VERIFICAR QUE LAS TABLAS EXISTAN
-- ========================================

-- Verificar estructura de chat_conversations
DO $$
BEGIN
    -- Si la columna 'channel' no existe, no hacer nada (ya que ahora está en metadata)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_conversations' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE chat_conversations 
        ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');
    END IF;
END $$;

-- ========================================
-- GRANT PERMISOS ADICIONALES
-- ========================================

-- Asegurar que el rol anon tenga todos los permisos necesarios
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Asegurar que el rol authenticated tenga todos los permisos necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- FUNCIÓN PARA LIMPIAR CONVERSACIONES ANTIGUAS
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS void AS $$
BEGIN
    -- Marcar como archivadas las conversaciones de más de 24 horas sin actividad
    UPDATE chat_conversations 
    SET status = 'archived'
    WHERE status = 'active' 
    AND last_activity < NOW() - INTERVAL '24 hours';
    
    -- Eliminar conversaciones archivadas de más de 7 días
    DELETE FROM chat_conversations 
    WHERE status = 'archived' 
    AND last_activity < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comentario: Para ejecutar la limpieza manualmente:
-- SELECT cleanup_old_conversations();

-- ========================================
-- MENSAJE DE CONFIRMACIÓN
-- ========================================
DO $$
BEGIN
    RAISE NOTICE 'Permisos de chat configurados correctamente. Las tablas ahora permiten INSERT, SELECT y UPDATE para todos los usuarios.';
END $$;