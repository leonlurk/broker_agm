-- ========================================
-- TABLAS PARA SISTEMA DE CHAT CON GEMINI
-- ========================================
-- Incluye contexto persistente, historial y limpieza automática

-- 1. TABLA DE CONVERSACIONES
-- Almacena info de cada conversación/sesión de chat
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE NOT NULL, -- Para identificar sesión única
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    is_human_controlled BOOLEAN DEFAULT FALSE, -- Si un humano tomó el control
    assigned_agent_id UUID, -- ID del agente humano asignado
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    metadata JSONB DEFAULT '{}', -- Info adicional (device, browser, location, etc)
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'), -- Para auto-limpieza
    
    -- Índices para búsquedas rápidas
    CONSTRAINT idx_conv_user_status UNIQUE (user_id, status)
);

-- Índices adicionales
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX idx_chat_conversations_expires ON chat_conversations(expires_at);
CREATE INDEX idx_chat_conversations_activity ON chat_conversations(last_activity DESC);

-- 2. TABLA DE MENSAJES
-- Almacena todos los mensajes del chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'ai', 'agent', 'system')),
    sender_id UUID, -- ID del usuario o agente
    sender_name VARCHAR(100), -- Nombre para mostrar
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    
    -- Contexto y metadata
    intent VARCHAR(50), -- Intent detectado por IA (deposito, retiro, kyc, etc)
    confidence DECIMAL(3,2), -- Confianza de la IA (0.00 a 1.00)
    metadata JSONB DEFAULT '{}', -- Attachments, quick replies, buttons, etc
    
    -- Estado del mensaje
    is_read BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Índices para mensajes
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_expires ON chat_messages(expires_at);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_type, sender_id);

-- 3. TABLA DE CONTEXTO DE CONVERSACIÓN
-- Guarda el contexto acumulado para mantener coherencia
CREATE TABLE IF NOT EXISTS chat_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL, -- 'user_info', 'conversation_summary', 'detected_needs'
    context_data JSONB NOT NULL, -- Datos del contexto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    CONSTRAINT unique_context_type UNIQUE (conversation_id, context_type)
);

CREATE INDEX idx_chat_context_conversation ON chat_context(conversation_id);

-- 4. TABLA DE RESPUESTAS RÁPIDAS Y PLANTILLAS
-- Para respuestas pre-configuradas del CRM
CREATE TABLE IF NOT EXISTS chat_quick_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    trigger_keywords TEXT[], -- Array de palabras clave
    response_text TEXT NOT NULL,
    response_metadata JSONB DEFAULT '{}', -- Botones, links, etc
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quick_responses_category ON chat_quick_responses(category);
CREATE INDEX idx_quick_responses_keywords ON chat_quick_responses USING GIN(trigger_keywords);

-- 5. TABLA DE MÉTRICAS Y ANALYTICS
-- Para dashboards y reportes
CREATE TABLE IF NOT EXISTS chat_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'response_time', 'satisfaction', 'resolution'
    metric_value JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_metrics_type ON chat_metrics(metric_type);
CREATE INDEX idx_chat_metrics_recorded ON chat_metrics(recorded_at DESC);

-- ========================================
-- FUNCIONES Y TRIGGERS
-- ========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_chat_conversations_updated_at 
    BEFORE UPDATE ON chat_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_context_updated_at 
    BEFORE UPDATE ON chat_context 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para limpiar mensajes antiguos (más de 24 horas)
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void AS $$
BEGIN
    -- Eliminar mensajes expirados
    DELETE FROM chat_messages 
    WHERE expires_at < NOW();
    
    -- Eliminar conversaciones expiradas
    DELETE FROM chat_conversations 
    WHERE expires_at < NOW() 
    AND status != 'archived'; -- No eliminar archivadas
    
    -- Eliminar contextos expirados
    DELETE FROM chat_context 
    WHERE expires_at < NOW();
    
    -- Log de limpieza
    INSERT INTO chat_metrics (metric_type, metric_value)
    VALUES ('cleanup', jsonb_build_object(
        'cleaned_at', NOW(),
        'type', 'automatic_24h_cleanup'
    ));
END;
$$ LANGUAGE plpgsql;

-- Función para obtener contexto completo de una conversación
CREATE OR REPLACE FUNCTION get_conversation_context(p_conversation_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_context JSONB;
BEGIN
    SELECT jsonb_build_object(
        'conversation', row_to_json(c.*),
        'recent_messages', (
            SELECT jsonb_agg(row_to_json(m.*) ORDER BY m.created_at DESC)
            FROM (
                SELECT * FROM chat_messages 
                WHERE conversation_id = p_conversation_id 
                ORDER BY created_at DESC 
                LIMIT 20
            ) m
        ),
        'context_data', (
            SELECT jsonb_object_agg(context_type, context_data)
            FROM chat_context
            WHERE conversation_id = p_conversation_id
        )
    ) INTO v_context
    FROM chat_conversations c
    WHERE c.id = p_conversation_id;
    
    RETURN v_context;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_context ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
-- Usuarios solo pueden ver sus propias conversaciones
CREATE POLICY "Users can view own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Usuarios pueden ver mensajes de sus conversaciones
CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Contexto solo accesible por el dueño de la conversación
CREATE POLICY "Users can view own context" ON chat_context
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_context.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- ========================================
-- SCHEDULED JOBS (Usando pg_cron o Supabase Edge Functions)
-- ========================================

-- Si tienes pg_cron habilitado en Supabase:
-- SELECT cron.schedule('cleanup-chat-daily', '0 3 * * *', 'SELECT cleanup_old_chat_messages();');

-- Alternativamente, crear un Edge Function en Supabase que se ejecute cada 24h

-- ========================================
-- VISTAS ÚTILES PARA CRM
-- ========================================

-- Vista para el dashboard del CRM
CREATE OR REPLACE VIEW crm_active_chats AS
SELECT 
    c.id,
    c.user_id,
    u.email as user_email,
    u.raw_user_meta_data->>'username' as username,
    c.status,
    c.is_human_controlled,
    c.priority,
    c.last_activity,
    COUNT(m.id) as message_count,
    MAX(m.created_at) as last_message_at,
    c.metadata
FROM chat_conversations c
LEFT JOIN auth.users u ON c.user_id = u.id
LEFT JOIN chat_messages m ON c.id = m.conversation_id
WHERE c.status = 'active'
GROUP BY c.id, u.id, u.email, u.raw_user_meta_data;

-- Vista de métricas diarias
CREATE OR REPLACE VIEW chat_daily_metrics AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT conversation_id) as total_conversations,
    COUNT(*) as total_messages,
    AVG(CASE WHEN sender_type = 'ai' THEN confidence END) as avg_ai_confidence,
    COUNT(DISTINCT CASE WHEN sender_type = 'user' THEN sender_id END) as unique_users
FROM chat_messages
GROUP BY DATE(created_at);

-- ========================================
-- DATOS INICIALES (OPCIONAL)
-- ========================================

-- Insertar algunas respuestas rápidas comunes
INSERT INTO chat_quick_responses (category, trigger_keywords, response_text) VALUES
('greeting', ARRAY['hola', 'hello', 'hi', 'buenos dias'], 'Hola! Soy Alpha, tu asistente de AGM. ¿En qué puedo ayudarte hoy?'),
('deposit', ARRAY['depositar', 'deposit', 'agregar fondos'], 'Para depositar, ve a Wallet > Depositar. Aceptamos transferencias, tarjetas y crypto.'),
('withdrawal', ARRAY['retirar', 'withdrawal', 'sacar dinero'], 'Para retirar fondos, necesitas KYC aprobado. Ve a Wallet > Retirar.'),
('kyc', ARRAY['verificar', 'kyc', 'documentos'], 'Para verificar tu cuenta, ve a Configuración > Verificación KYC.')
ON CONFLICT DO NOTHING;

-- ========================================
-- PERMISOS PARA SERVICE ROLE (Backend)
-- ========================================

-- Grant para que el backend pueda ejecutar las funciones
GRANT EXECUTE ON FUNCTION cleanup_old_chat_messages() TO service_role;
GRANT EXECUTE ON FUNCTION get_conversation_context(UUID) TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;