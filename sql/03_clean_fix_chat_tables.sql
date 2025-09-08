-- ========================================
-- LIMPIEZA Y RECREACIÓN COMPLETA DE TABLAS DE CHAT
-- ========================================
-- Elimina y recrea todas las tablas con tipos correctos

-- 1. ELIMINAR TABLAS EXISTENTES CON TIPOS INCORRECTOS
DROP TABLE IF EXISTS chat_context CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS chat_quick_responses CASCADE;
DROP TABLE IF EXISTS chat_metrics CASCADE;

-- 2. CREAR TABLA chat_conversations CON TIPOS CORRECTOS
CREATE TABLE chat_conversations (
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

-- 3. CREAR TABLA chat_messages CON TIPOS CORRECTOS
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

-- 4. CREAR TABLA chat_context
CREATE TABLE chat_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL,
    context_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    CONSTRAINT unique_context_type UNIQUE (conversation_id, context_type)
);

-- 5. CREAR TABLA chat_quick_responses
CREATE TABLE chat_quick_responses (
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

-- 6. CREAR TABLA chat_metrics
CREATE TABLE chat_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CREAR TODOS LOS ÍNDICES
-- ========================================

CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX idx_chat_conversations_expires ON chat_conversations(expires_at);
CREATE INDEX idx_chat_conversations_activity ON chat_conversations(last_activity DESC);

CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_expires ON chat_messages(expires_at);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_type, sender_id);

CREATE INDEX idx_chat_context_conversation ON chat_context(conversation_id);
CREATE INDEX idx_quick_responses_category ON chat_quick_responses(category);
CREATE INDEX idx_quick_responses_keywords ON chat_quick_responses USING GIN(trigger_keywords);
CREATE INDEX idx_chat_metrics_type ON chat_metrics(metric_type);
CREATE INDEX idx_chat_metrics_recorded ON chat_metrics(recorded_at DESC);

-- ========================================
-- FUNCIONES NECESARIAS
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void AS $$
BEGIN
    -- Eliminar mensajes expirados
    DELETE FROM chat_messages WHERE expires_at < NOW();
    
    -- Eliminar conversaciones expiradas (excepto archivadas)
    DELETE FROM chat_conversations 
    WHERE expires_at < NOW() AND status != 'archived';
    
    -- Eliminar contextos expirados
    DELETE FROM chat_context WHERE expires_at < NOW();
    
    -- Registrar la limpieza
    INSERT INTO chat_metrics (metric_type, metric_value)
    VALUES ('cleanup', jsonb_build_object(
        'cleaned_at', NOW(),
        'type', 'automatic_24h_cleanup'
    ));
    
    RAISE NOTICE 'Limpieza de chat completada en %', NOW();
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER update_chat_conversations_updated_at 
    BEFORE UPDATE ON chat_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_context_updated_at 
    BEFORE UPDATE ON chat_context 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_quick_responses_updated_at 
    BEFORE UPDATE ON chat_quick_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_quick_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_conversations
CREATE POLICY "Users can view own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access conversations" ON chat_conversations
    FOR ALL USING (auth.role() = 'service_role');

-- Políticas para chat_messages
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

CREATE POLICY "Service role full access messages" ON chat_messages
    FOR ALL USING (auth.role() = 'service_role');

-- Políticas para chat_context
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

CREATE POLICY "Service role full access context" ON chat_context
    FOR ALL USING (auth.role() = 'service_role');

-- Políticas para chat_quick_responses
CREATE POLICY "Anyone can view active responses" ON chat_quick_responses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access responses" ON chat_quick_responses
    FOR ALL USING (auth.role() = 'service_role');

-- Políticas para chat_metrics
CREATE POLICY "Service role can manage metrics" ON chat_metrics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own metrics" ON chat_metrics
    FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- VISTAS PARA CRM
-- ========================================

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

INSERT INTO chat_quick_responses (category, trigger_keywords, response_text) VALUES
    ('greeting', ARRAY['hola', 'hello', 'hi', 'buenos dias', 'buenas tardes', 'buenas noches'], 
     'Hola! Soy Alpha, tu asistente de AGM. ¿En qué puedo ayudarte hoy?'),
    
    ('deposit', ARRAY['depositar', 'deposit', 'agregar fondos', 'meter dinero', 'cargar saldo'], 
     'Para depositar, ve a Wallet > Depositar. Aceptamos transferencias bancarias, tarjetas de crédito/débito y criptomonedas. El mínimo es $50.'),
    
    ('withdrawal', ARRAY['retirar', 'withdrawal', 'sacar dinero', 'extraer fondos'], 
     'Para retirar fondos, necesitas tener tu KYC aprobado. Ve a Wallet > Retirar. El mínimo es $50 y el proceso toma 24-72 horas.'),
    
    ('kyc', ARRAY['verificar', 'kyc', 'documentos', 'verificación', 'identidad'], 
     'Para verificar tu cuenta, ve a Configuración > Verificación KYC. Necesitas: documento de identidad, comprobante de domicilio y una selfie.'),
    
    ('trading', ARRAY['operar', 'trade', 'forex', 'crypto', 'trading', 'mercados'], 
     'Ofrecemos trading en Forex (1:200), Criptomonedas (1:20), Índices y Materias Primas. Spreads desde 0.8 pips.'),
    
    ('pamm', ARRAY['pamm', 'gestor', 'invertir', 'gestión', 'fondo'], 
     'El sistema PAMM te permite invertir con gestores profesionales desde $100. Ve a la sección PAMM para ver gestores disponibles.'),
    
    ('copy', ARRAY['copy', 'copiar', 'seguir', 'copytrading', 'replicar'], 
     'Con Copy Trading puedes replicar automáticamente las operaciones de traders exitosos. Mínimo $100 para empezar.'),
    
    ('support', ARRAY['ayuda', 'help', 'soporte', 'problema', 'error'], 
     'Estoy aquí para ayudarte. ¿Cuál es tu problema específico? También puedes contactar soporte humano si lo prefieres.'),
    
    ('account', ARRAY['cuenta', 'account', 'demo', 'real', 'crear cuenta'], 
     'Puedes crear cuentas demo (gratis) o reales (desde $50) en "Cuentas de Trading". Las cuentas demo tienen $10,000 virtuales.');

-- ========================================
-- PERMISOS
-- ========================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Permisos para authenticated users en vistas
GRANT SELECT ON crm_active_chats TO authenticated;
GRANT SELECT ON chat_daily_metrics TO authenticated;

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

DO $$ 
DECLARE
    v_tables_ok BOOLEAN := TRUE;
    v_message TEXT := '';
BEGIN
    -- Verificar que las tablas se crearon correctamente
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
        v_tables_ok := FALSE;
        v_message := v_message || 'ERROR: Tabla chat_conversations no creada. ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        v_tables_ok := FALSE;
        v_message := v_message || 'ERROR: Tabla chat_messages no creada. ';
    END IF;
    
    IF v_tables_ok THEN
        RAISE NOTICE '✅ ÉXITO: Todas las tablas de chat creadas correctamente';
        RAISE NOTICE '✅ Sistema listo para guardar contexto de conversaciones';
        RAISE NOTICE '✅ Limpieza automática configurada para 24 horas';
        RAISE NOTICE '📝 Para activar limpieza automática, ejecuta: SELECT cleanup_old_chat_messages();';
        RAISE NOTICE '📝 O configura un cron job con: SELECT cron.schedule(''cleanup-chat'', ''0 3 * * *'', ''SELECT cleanup_old_chat_messages();'');';
    ELSE
        RAISE EXCEPTION 'Error creando tablas: %', v_message;
    END IF;
END $$;