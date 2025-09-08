-- ========================================
-- MIGRACIÓN Y ACTUALIZACIÓN DE TABLAS DE CHAT
-- ========================================
-- Añade columnas faltantes a tablas existentes

-- 1. VERIFICAR Y ACTUALIZAR TABLA chat_conversations
DO $$ 
BEGIN
    -- Añadir columna expires_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_conversations' 
                   AND column_name = 'expires_at') THEN
        ALTER TABLE chat_conversations 
        ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');
    END IF;
    
    -- Añadir columna updated_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_conversations' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE chat_conversations 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Añadir columna priority si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_conversations' 
                   AND column_name = 'priority') THEN
        ALTER TABLE chat_conversations 
        ADD COLUMN priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
    
    -- Añadir columna assigned_agent_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chat_conversations' 
                   AND column_name = 'assigned_agent_id') THEN
        ALTER TABLE chat_conversations 
        ADD COLUMN assigned_agent_id UUID;
    END IF;
END $$;

-- 2. VERIFICAR Y ACTUALIZAR TABLA chat_messages
DO $$ 
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'chat_messages') THEN
        
        -- Añadir columna expires_at si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'chat_messages' 
                       AND column_name = 'expires_at') THEN
            ALTER TABLE chat_messages 
            ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');
        END IF;
        
        -- Añadir columna intent si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'chat_messages' 
                       AND column_name = 'intent') THEN
            ALTER TABLE chat_messages 
            ADD COLUMN intent VARCHAR(50);
        END IF;
        
        -- Añadir columna confidence si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'chat_messages' 
                       AND column_name = 'confidence') THEN
            ALTER TABLE chat_messages 
            ADD COLUMN confidence DECIMAL(3,2);
        END IF;
        
        -- Añadir columna is_edited si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'chat_messages' 
                       AND column_name = 'is_edited') THEN
            ALTER TABLE chat_messages 
            ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Añadir columna edited_at si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'chat_messages' 
                       AND column_name = 'edited_at') THEN
            ALTER TABLE chat_messages 
            ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
        END IF;
    ELSE
        -- Crear tabla chat_messages si no existe
        CREATE TABLE chat_messages (
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
    END IF;
END $$;

-- 3. CREAR TABLA chat_context SI NO EXISTE
CREATE TABLE IF NOT EXISTS chat_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL,
    context_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 4. CREAR TABLA chat_quick_responses SI NO EXISTE
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

-- 5. CREAR TABLA chat_metrics SI NO EXISTE
CREATE TABLE IF NOT EXISTS chat_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CREAR ÍNDICES FALTANTES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_expires ON chat_conversations(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_activity ON chat_conversations(last_activity DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_expires ON chat_messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_type, sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_context_conversation ON chat_context(conversation_id);
CREATE INDEX IF NOT EXISTS idx_quick_responses_category ON chat_quick_responses(category);
CREATE INDEX IF NOT EXISTS idx_quick_responses_keywords ON chat_quick_responses USING GIN(trigger_keywords);
CREATE INDEX IF NOT EXISTS idx_chat_metrics_type ON chat_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_chat_metrics_recorded ON chat_metrics(recorded_at DESC);

-- ========================================
-- AÑADIR CONSTRAINTS ÚNICOS
-- ========================================

DO $$ 
BEGIN
    -- Constraint único para contexto
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_context_type') THEN
        ALTER TABLE chat_context ADD CONSTRAINT unique_context_type UNIQUE (conversation_id, context_type);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- FUNCIONES NECESARIAS
-- ========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
-- TRIGGERS
-- ========================================

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
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chat_quick_responses_updated_at') THEN
        CREATE TRIGGER update_chat_quick_responses_updated_at 
            BEFORE UPDATE ON chat_quick_responses 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Habilitar RLS en todas las tablas de chat
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_quick_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_metrics ENABLE ROW LEVEL SECURITY;

-- Eliminar y recrear políticas
DO $$ 
BEGIN
    -- Eliminar políticas existentes
    DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can create own conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
    DROP POLICY IF EXISTS "Users can create messages in own conversations" ON chat_messages;
    DROP POLICY IF EXISTS "Users can view own context" ON chat_context;
    DROP POLICY IF EXISTS "Users can manage own context" ON chat_context;
    DROP POLICY IF EXISTS "Anyone can view active responses" ON chat_quick_responses;
    DROP POLICY IF EXISTS "Service role can manage metrics" ON chat_metrics;
END $$;

-- Crear políticas nuevas
CREATE POLICY "Users can view own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);

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

CREATE POLICY "Anyone can view active responses" ON chat_quick_responses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage metrics" ON chat_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- VISTAS PARA CRM
-- ========================================

DROP VIEW IF EXISTS crm_active_chats CASCADE;
CREATE VIEW crm_active_chats AS
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
CREATE VIEW chat_daily_metrics AS
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

INSERT INTO chat_quick_responses (category, trigger_keywords, response_text)
SELECT * FROM (VALUES
    ('greeting', ARRAY['hola', 'hello', 'hi', 'buenos dias'], 'Hola! Soy Alpha, tu asistente de AGM. ¿En qué puedo ayudarte hoy?'),
    ('deposit', ARRAY['depositar', 'deposit', 'agregar fondos'], 'Para depositar, ve a Wallet > Depositar. Aceptamos transferencias, tarjetas y crypto.'),
    ('withdrawal', ARRAY['retirar', 'withdrawal', 'sacar dinero'], 'Para retirar fondos, necesitas KYC aprobado. Ve a Wallet > Retirar.'),
    ('kyc', ARRAY['verificar', 'kyc', 'documentos'], 'Para verificar tu cuenta, ve a Configuración > Verificación KYC.'),
    ('trading', ARRAY['operar', 'trade', 'forex', 'crypto'], 'Ofrecemos trading en Forex, Crypto, Índices y Materias Primas con spreads competitivos.'),
    ('pamm', ARRAY['pamm', 'gestor', 'invertir'], 'El sistema PAMM te permite invertir con gestores profesionales desde $100.'),
    ('copy', ARRAY['copy', 'copiar', 'seguir'], 'Con Copy Trading puedes replicar automáticamente las operaciones de traders exitosos.')
) AS t(category, trigger_keywords, response_text)
WHERE NOT EXISTS (SELECT 1 FROM chat_quick_responses WHERE category = t.category);

-- ========================================
-- PERMISOS
-- ========================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Mensaje de éxito
DO $$ 
BEGIN
    RAISE NOTICE 'Migración de tablas de chat completada exitosamente.';
    RAISE NOTICE 'Las tablas ahora tienen limpieza automática después de 24 horas.';
    RAISE NOTICE 'Para activar la limpieza, configura un Edge Function o cron job.';
END $$;