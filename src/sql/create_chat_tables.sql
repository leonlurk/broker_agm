-- Crear tablas para el sistema de chat integrado

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_human_controlled BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'flofy', 'asesor', 'system')),
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_activity ON chat_conversations(last_activity DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_chat_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp de conversación cuando se añade un mensaje
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON chat_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_conversation_timestamp();

-- Función para limpiar conversaciones antiguas (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_chat_conversations(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM chat_conversations 
    WHERE status = 'archived' 
    AND updated_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE chat_conversations IS 'Tabla que almacena las conversaciones del sistema de chat';
COMMENT ON TABLE chat_messages IS 'Tabla que almacena los mensajes individuales de cada conversación';

COMMENT ON COLUMN chat_conversations.is_human_controlled IS 'Indica si un asesor humano está controlando la conversación';
COMMENT ON COLUMN chat_conversations.status IS 'Estado de la conversación: active, closed, archived';
COMMENT ON COLUMN chat_messages.sender IS 'Quien envió el mensaje: user, flofy, asesor, system';
COMMENT ON COLUMN chat_messages.is_read IS 'Indica si el mensaje ha sido leído por el usuario';

-- Insertar datos de prueba (opcional, comentar para producción)
-- INSERT INTO chat_conversations (id, user_id, status) 
-- VALUES ('conversation_test_user', 'test_user', 'active')
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO chat_messages (id, conversation_id, user_id, sender, message, timestamp)
-- VALUES 
--     ('msg_welcome_test', 'conversation_test_user', 'test_user', 'flofy', '¡Hola! Soy Flofy, tu asistente de trading. ¿En qué puedo ayudarte hoy?', CURRENT_TIMESTAMP),
--     ('msg_test_user', 'conversation_test_user', 'test_user', 'user', 'Hola, necesito ayuda con mi cuenta de trading', CURRENT_TIMESTAMP)
-- ON CONFLICT (id) DO NOTHING;