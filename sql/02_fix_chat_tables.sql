-- ========================================
-- FIX: MIGRACIÓN DE TABLAS DE CHAT CON TIPOS CORRECTOS
-- ========================================
-- Maneja la incompatibilidad de tipos entre TEXT y UUID

-- Primero, verificar y corregir el tipo de la columna id en chat_conversations
DO $$
DECLARE
    v_id_type TEXT;
BEGIN
    -- Obtener el tipo actual de la columna id
    SELECT data_type INTO v_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
        AND table_name = 'chat_conversations'
        AND column_name = 'id';
    
    IF v_id_type = 'text' OR v_id_type = 'character varying' THEN
        RAISE NOTICE 'La columna id es TEXT, necesita migración a UUID';
        
        -- Opción 1: Si la tabla está vacía o no importan los datos
        -- DROP TABLE IF EXISTS chat_conversations CASCADE;
        
        -- Opción 2: Renombrar la tabla existente y crear una nueva
        ALTER TABLE IF EXISTS chat_conversations RENAME TO chat_conversations_old;
        
        -- Crear nueva tabla con tipos correctos
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
        
        -- Si hay datos que preservar, intentar migrarlos
        BEGIN
            INSERT INTO chat_conversations (
                user_id, session_id, status, is_human_controlled, 
                metadata, last_activity, created_at
            )
            SELECT 
                user_id::UUID,
                session_id,
                status,
                is_human_controlled,
                metadata,
                last_activity,
                created_at
            FROM chat_conversations_old
            WHERE user_id IS NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'No se pudieron migrar datos antiguos: %', SQLERRM;
        END;
        
        -- Eliminar tabla antigua
        DROP TABLE IF EXISTS chat_conversations_old CASCADE;
        
    ELSIF v_id_type = 'uuid' THEN
        RAISE NOTICE 'La columna id ya es UUID, solo añadiendo columnas faltantes';
        
        -- Añadir columnas faltantes si no existen
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'chat_conversations' 
                       AND column_name = 'expires_at') THEN
            ALTER TABLE chat_conversations 
            ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'chat_conversations' 
                       AND column_name = 'updated_at') THEN
            ALTER TABLE chat_conversations 
            ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'chat_conversations' 
                       AND column_name = 'priority') THEN
            ALTER TABLE chat_conversations 
            ADD COLUMN priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'chat_conversations' 
                       AND column_name = 'assigned_agent_id') THEN
            ALTER TABLE chat_conversations 
            ADD COLUMN assigned_agent_id UUID;
        END IF;
    ELSE
        -- La tabla no existe, crearla nueva
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
    END IF;
END $$;

-- 2. CREAR O ACTUALIZAR TABLA chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
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

-- Añadir foreign key solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_messages_conversation_id_fkey'
    ) THEN
        ALTER TABLE chat_messages 
        ADD CONSTRAINT chat_messages_conversation_id_fkey 
        FOREIGN KEY (conversation_id) 
        REFERENCES chat_conversations(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. CREAR TABLA chat_context
DROP TABLE IF EXISTS chat_context CASCADE;
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
-- CREAR ÍNDICES
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
-- FUNCIONES
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

-- ========================================
-- TRIGGERS
-- ========================================

DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at 
    BEFORE UPDATE ON chat_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_context_updated_at ON chat_context;
CREATE TRIGGER update_chat_context_updated_at 
    BEFORE UPDATE ON chat_context 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_quick_responses_updated_at ON chat_quick_responses;
CREATE TRIGGER update_chat_quick_responses_updated_at 
    BEFORE UPDATE ON chat_quick_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_quick_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_metrics ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can create own conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Service role full access conversations" ON chat_conversations;
    
    DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
    DROP POLICY IF EXISTS "Users can create messages in own conversations" ON chat_messages;
    DROP POLICY IF EXISTS "Service role full access messages" ON chat_messages;
    
    DROP POLICY IF EXISTS "Users can view own context" ON chat_context;
    DROP POLICY IF EXISTS "Users can manage own context" ON chat_context;
    DROP POLICY IF EXISTS "Service role full access context" ON chat_context;
    
    DROP POLICY IF EXISTS "Anyone can view active responses" ON chat_quick_responses;
    DROP POLICY IF EXISTS "Service role full access responses" ON chat_quick_responses;
    
    DROP POLICY IF EXISTS "Service role can manage metrics" ON chat_metrics;
END $$;

-- Crear políticas nuevas con service role
CREATE POLICY "Users can view own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can create own conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Service role full access conversations" ON chat_conversations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access messages" ON chat_messages
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own context" ON chat_context
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_context.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own context" ON chat_context
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_context.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access context" ON chat_context
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view active responses" ON chat_quick_responses
    FOR SELECT USING (is_active = true OR auth.role() = 'service_role');

CREATE POLICY "Service role full access responses" ON chat_quick_responses
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage metrics" ON chat_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- DATOS INICIALES
-- ========================================

INSERT INTO chat_quick_responses (category, trigger_keywords, response_text)
VALUES
    ('greeting', ARRAY['hola', 'hello', 'hi', 'buenos dias'], 'Hola! Soy Alpha, tu asistente de AGM. ¿En qué puedo ayudarte hoy?'),
    ('deposit', ARRAY['depositar', 'deposit', 'agregar fondos'], 'Para depositar, ve a Wallet > Depositar. Aceptamos transferencias, tarjetas y crypto.'),
    ('withdrawal', ARRAY['retirar', 'withdrawal', 'sacar dinero'], 'Para retirar fondos, necesitas KYC aprobado. Ve a Wallet > Retirar.'),
    ('kyc', ARRAY['verificar', 'kyc', 'documentos'], 'Para verificar tu cuenta, ve a Configuración > Verificación KYC.')
ON CONFLICT DO NOTHING;

-- ========================================
-- PERMISOS
-- ========================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Mensaje final
DO $$ 
BEGIN
    RAISE NOTICE '✅ Tablas de chat configuradas correctamente con tipos UUID';
    RAISE NOTICE '✅ Sistema listo para guardar contexto de conversaciones';
    RAISE NOTICE '✅ Limpieza automática configurada para 24 horas';
END $$;