-- ========================================
-- TABLAS PARA SISTEMA DE CHAT CON GEMINI (VERSIÓN SEGURA)
-- ========================================
-- Verifica existencia antes de crear para evitar errores

-- 1. TABLA DE CONVERSACIONES
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    is_human_controlled BOOLEAN DEFAULT FALSE,
    assigned_agent_id UUID,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    metadata JSONB DEFAULT '{}',
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Agregar constraint si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idx_conv_user_status') THEN
        ALTER TABLE chat_conversations ADD CONSTRAINT idx_conv_user_status UNIQUE (user_id, status);
    END IF;
END $$;

-- Crear índices solo si no existen
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_expires ON chat_conversations(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_activity ON chat_conversations(last_activity DESC);

-- 2. TABLA DE MENSAJES
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'ai', 'agent', 'system')),
    sender_id UUID,
    sender_name VARCHAR(100),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    intent VARCHAR(50),
    confidence DECIMAL(3,2),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_expires ON chat_messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_type, sender_id);

-- 3. TABLA DE CONTEXTO DE CONVERSACIÓN
CREATE TABLE IF NOT EXISTS chat_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL,
    context_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Agregar constraint único si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_context_type') THEN
        ALTER TABLE chat_context ADD CONSTRAINT unique_context_type UNIQUE (conversation_id, context_type);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_context_conversation ON chat_context(conversation_id);

-- 4. TABLA DE RESPUESTAS RÁPIDAS Y PLANTILLAS
CREATE TABLE IF NOT EXISTS chat_quick_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    trigger_keywords TEXT[],
    response_text TEXT NOT NULL,
    response_metadata JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quick_responses_category ON chat_quick_responses(category);
CREATE INDEX IF NOT EXISTS idx_quick_responses_keywords ON chat_quick_responses USING GIN(trigger_keywords);

-- 5. TABLA DE MÉTRICAS Y ANALYTICS
CREATE TABLE IF NOT EXISTS chat_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_metrics_type ON chat_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_chat_metrics_recorded ON chat_metrics(recorded_at DESC);

-- ========================================
-- FUNCIONES Y TRIGGERS
-- ========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers solo si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chat_conversations_updated_at') THEN
        CREATE TRIGGER update_chat_conversations_updated_at 
            BEFORE UPDATE ON chat_conversations 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chat_context_updated_at') THEN
        CREATE TRIGGER update_chat_context_updated_at 
            BEFORE UPDATE ON chat_context 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Función para limpiar mensajes antiguos
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM chat_messages WHERE expires_at < NOW();
    DELETE FROM chat_conversations WHERE expires_at < NOW() AND status != 'archived';
    DELETE FROM chat_context WHERE expires_at < NOW();
    
    INSERT INTO chat_metrics (metric_type, metric_value)
    VALUES ('cleanup', jsonb_build_object(
        'cleaned_at', NOW(),
        'type', 'automatic_24h_cleanup'
    ));
END;
$$ LANGUAGE plpgsql;

-- Función para obtener contexto completo
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
ALTER TABLE chat_quick_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_metrics ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DO $$ 
BEGIN
    -- Chat conversations policies
    DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can create own conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
    
    -- Chat messages policies
    DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
    DROP POLICY IF EXISTS "Users can create messages in own conversations" ON chat_messages;
    
    -- Chat context policies
    DROP POLICY IF EXISTS "Users can view own context" ON chat_context;
    DROP POLICY IF EXISTS "Users can manage own context" ON chat_context;
    
    -- Quick responses policies
    DROP POLICY IF EXISTS "Anyone can view active responses" ON chat_quick_responses;
    
    -- Metrics policies
    DROP POLICY IF EXISTS "Service role can manage metrics" ON chat_metrics;
END $$;

-- Crear políticas nuevas
-- Conversaciones
CREATE POLICY "Users can view own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Mensajes
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

-- Contexto
CREATE POLICY "Users can view own context" ON chat_context
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_context.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own context" ON chat_context
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_context.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Respuestas rápidas (todos pueden ver las activas)
CREATE POLICY "Anyone can view active responses" ON chat_quick_responses
    FOR SELECT USING (is_active = true);

-- Métricas (solo service role)
CREATE POLICY "Service role can manage metrics" ON chat_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- VISTAS ÚTILES PARA CRM
-- ========================================

-- Eliminar vistas si existen y recrear
DROP VIEW IF EXISTS crm_active_chats CASCADE;
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

DROP VIEW IF EXISTS chat_daily_metrics CASCADE;
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
-- DATOS INICIALES
-- ========================================

-- Insertar respuestas rápidas solo si la tabla está vacía
INSERT INTO chat_quick_responses (category, trigger_keywords, response_text)
SELECT * FROM (VALUES
    ('greeting', ARRAY['hola', 'hello', 'hi', 'buenos dias'], 'Hola! Soy Alpha, tu asistente de AGM. ¿En qué puedo ayudarte hoy?'),
    ('deposit', ARRAY['depositar', 'deposit', 'agregar fondos'], 'Para depositar, ve a Wallet > Depositar. Aceptamos transferencias, tarjetas y crypto.'),
    ('withdrawal', ARRAY['retirar', 'withdrawal', 'sacar dinero'], 'Para retirar fondos, necesitas KYC aprobado. Ve a Wallet > Retirar.'),
    ('kyc', ARRAY['verificar', 'kyc', 'documentos'], 'Para verificar tu cuenta, ve a Configuración > Verificación KYC.')
) AS t(category, trigger_keywords, response_text)
WHERE NOT EXISTS (SELECT 1 FROM chat_quick_responses LIMIT 1);

-- ========================================
-- GRANTS
-- ========================================

-- Asegurar que service_role tenga acceso completo
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Mensaje de confirmación
DO $$ 
BEGIN
    RAISE NOTICE 'Tablas de chat creadas exitosamente. Para activar limpieza automática, configura un cron job o Edge Function.';
END $$;