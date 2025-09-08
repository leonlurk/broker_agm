-- ========================================
-- TABLA DE FEEDBACK DE MENSAJES DEL CHAT
-- ========================================
-- Para que el equipo de soporte pueda ver qué respuestas son útiles

-- 1. CREAR TABLA DE FEEDBACK
CREATE TABLE IF NOT EXISTS chat_message_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Feedback del usuario
    is_helpful BOOLEAN NOT NULL, -- true = útil, false = no útil
    feedback_text TEXT, -- Comentario opcional del usuario
    
    -- Metadata para análisis
    message_intent VARCHAR(50), -- Intent detectado del mensaje original
    ai_confidence DECIMAL(3,2), -- Confianza de la IA en la respuesta
    response_time_ms INTEGER, -- Tiempo de respuesta en milisegundos
    
    -- Para mejora continua
    reviewed_by UUID, -- ID del agente que revisó el feedback
    reviewed_at TIMESTAMP WITH TIME ZONE,
    improvement_notes TEXT, -- Notas del equipo sobre cómo mejorar
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar feedback duplicado del mismo usuario para el mismo mensaje
    CONSTRAINT unique_user_message_feedback UNIQUE (message_id, user_id)
);

-- 2. ÍNDICES PARA BÚSQUEDAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_feedback_message ON chat_message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON chat_message_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_helpful ON chat_message_feedback(is_helpful);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON chat_message_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_reviewed ON chat_message_feedback(reviewed_by, reviewed_at);

-- 3. VISTA PARA DASHBOARD DE FEEDBACK
CREATE OR REPLACE VIEW chat_feedback_analytics AS
SELECT 
    DATE(cmf.created_at) as date,
    COUNT(*) as total_feedback,
    COUNT(CASE WHEN cmf.is_helpful THEN 1 END) as helpful_count,
    COUNT(CASE WHEN NOT cmf.is_helpful THEN 1 END) as not_helpful_count,
    ROUND(COUNT(CASE WHEN cmf.is_helpful THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100, 2) as helpful_percentage,
    AVG(cmf.ai_confidence) as avg_ai_confidence,
    AVG(cmf.response_time_ms) as avg_response_time_ms,
    COUNT(DISTINCT cmf.user_id) as unique_users,
    COUNT(cmf.reviewed_by) as reviewed_count
FROM chat_message_feedback cmf
GROUP BY DATE(cmf.created_at)
ORDER BY date DESC;

-- 4. VISTA DETALLADA PARA CRM
CREATE OR REPLACE VIEW crm_chat_feedback_details AS
SELECT 
    cmf.id as feedback_id,
    cmf.created_at,
    cmf.is_helpful,
    cmf.feedback_text,
    cmf.message_intent,
    cmf.ai_confidence,
    cmf.response_time_ms,
    cmf.reviewed_by,
    cmf.reviewed_at,
    cmf.improvement_notes,
    
    -- Información del mensaje
    cm.message as original_message,
    cm.sender_type,
    cm.created_at as message_time,
    
    -- Información del usuario
    u.email as user_email,
    u.raw_user_meta_data->>'username' as username,
    
    -- Información de la conversación
    cc.session_id,
    cc.status as conversation_status,
    cc.priority,
    cc.is_human_controlled,
    
    -- Mensaje de respuesta de la IA (el siguiente mensaje después del usuario)
    (
        SELECT message 
        FROM chat_messages 
        WHERE conversation_id = cm.conversation_id 
        AND created_at > cm.created_at 
        AND sender_type = 'ai'
        ORDER BY created_at ASC 
        LIMIT 1
    ) as ai_response
    
FROM chat_message_feedback cmf
JOIN chat_messages cm ON cmf.message_id = cm.id
JOIN chat_conversations cc ON cmf.conversation_id = cc.id
JOIN auth.users u ON cmf.user_id = u.id
ORDER BY cmf.created_at DESC;

-- 5. FUNCIÓN PARA OBTENER ESTADÍSTICAS DE FEEDBACK
CREATE OR REPLACE FUNCTION get_feedback_stats(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_feedback BIGINT,
    helpful_count BIGINT,
    not_helpful_count BIGINT,
    helpful_percentage NUMERIC,
    avg_confidence NUMERIC,
    unique_users BIGINT,
    most_common_intents JSONB,
    feedback_by_day JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_feedback,
        COUNT(CASE WHEN is_helpful THEN 1 END)::BIGINT as helpful_count,
        COUNT(CASE WHEN NOT is_helpful THEN 1 END)::BIGINT as not_helpful_count,
        ROUND(COUNT(CASE WHEN is_helpful THEN 1 END)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0) * 100, 2) as helpful_percentage,
        ROUND(AVG(ai_confidence)::NUMERIC, 2) as avg_confidence,
        COUNT(DISTINCT user_id)::BIGINT as unique_users,
        (
            SELECT jsonb_agg(json_build_object(
                'intent', message_intent,
                'count', intent_count
            ) ORDER BY intent_count DESC)
            FROM (
                SELECT message_intent, COUNT(*) as intent_count
                FROM chat_message_feedback
                WHERE created_at::DATE BETWEEN p_start_date AND p_end_date
                AND message_intent IS NOT NULL
                GROUP BY message_intent
                LIMIT 5
            ) top_intents
        ) as most_common_intents,
        (
            SELECT jsonb_agg(json_build_object(
                'date', feedback_date,
                'helpful', helpful,
                'not_helpful', not_helpful
            ) ORDER BY feedback_date)
            FROM (
                SELECT 
                    created_at::DATE as feedback_date,
                    COUNT(CASE WHEN is_helpful THEN 1 END) as helpful,
                    COUNT(CASE WHEN NOT is_helpful THEN 1 END) as not_helpful
                FROM chat_message_feedback
                WHERE created_at::DATE BETWEEN p_start_date AND p_end_date
                GROUP BY created_at::DATE
            ) daily
        ) as feedback_by_day
    FROM chat_message_feedback
    WHERE created_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- 6. ROW LEVEL SECURITY
ALTER TABLE chat_message_feedback ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver y crear su propio feedback
CREATE POLICY "Users can view own feedback" ON chat_message_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own feedback" ON chat_message_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar su propio feedback (cambiar de opinión)
CREATE POLICY "Users can update own feedback" ON chat_message_feedback
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role tiene acceso completo
CREATE POLICY "Service role full access feedback" ON chat_message_feedback
    FOR ALL USING (auth.role() = 'service_role');

-- 7. TRIGGER PARA ACTUALIZAR MÉTRICAS
CREATE OR REPLACE FUNCTION update_feedback_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar métricas generales cuando se añade feedback
    IF TG_OP = 'INSERT' THEN
        INSERT INTO chat_metrics (
            metric_type,
            metric_value,
            user_id,
            conversation_id
        ) VALUES (
            'feedback_received',
            jsonb_build_object(
                'message_id', NEW.message_id,
                'is_helpful', NEW.is_helpful,
                'has_text', NEW.feedback_text IS NOT NULL
            ),
            NEW.user_id,
            NEW.conversation_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_feedback_metrics
    AFTER INSERT ON chat_message_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_metrics();

-- 8. PERMISOS
GRANT ALL ON chat_message_feedback TO service_role;
GRANT SELECT ON chat_feedback_analytics TO authenticated;
GRANT SELECT ON crm_chat_feedback_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_feedback_stats(DATE, DATE) TO authenticated;

-- 9. MENSAJE DE CONFIRMACIÓN
DO $$ 
BEGIN
    RAISE NOTICE '✅ Tabla de feedback creada exitosamente';
    RAISE NOTICE '📊 Vistas analíticas disponibles: chat_feedback_analytics, crm_chat_feedback_details';
    RAISE NOTICE '📈 Función de estadísticas: SELECT * FROM get_feedback_stats()';
END $$;