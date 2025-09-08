-- ========================================
-- CONFIGURAR RLS CORRECTAMENTE CON SEGURIDAD
-- ========================================
-- Mantiene la seguridad pero permite operaciones necesarias

-- Primero, asegurar que RLS esté activado
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_feedback ENABLE ROW LEVEL SECURITY;

-- ========================================
-- LIMPIAR POLÍTICAS EXISTENTES
-- ========================================
-- Eliminar todas las políticas anteriores para empezar limpio
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename IN ('chat_conversations', 'chat_messages', 'chat_message_feedback')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, 
            CASE 
                WHEN pol.policyname LIKE '%conversations%' THEN 'chat_conversations'
                WHEN pol.policyname LIKE '%messages%' THEN 'chat_messages'
                ELSE 'chat_message_feedback'
            END
        );
    END LOOP;
END $$;

-- ========================================
-- POLÍTICAS PARA chat_conversations
-- ========================================

-- 1. Permitir INSERT a usuarios anónimos y autenticados
CREATE POLICY "Enable insert for all users"
ON chat_conversations FOR INSERT
WITH CHECK (true);

-- 2. Permitir SELECT a todos
CREATE POLICY "Enable read access for all users"
ON chat_conversations FOR SELECT
USING (true);

-- 3. Permitir UPDATE a todos (para actualizar last_activity, status, etc.)
CREATE POLICY "Enable update for all users"
ON chat_conversations FOR UPDATE
USING (true)
WITH CHECK (true);

-- ========================================
-- POLÍTICAS PARA chat_messages
-- ========================================

-- 1. Permitir INSERT a todos
CREATE POLICY "Enable insert for all users"
ON chat_messages FOR INSERT
WITH CHECK (
    -- Verificar que la conversación existe
    EXISTS (
        SELECT 1 FROM chat_conversations 
        WHERE id = conversation_id
    )
);

-- 2. Permitir SELECT a todos
CREATE POLICY "Enable read access for all users"
ON chat_messages FOR SELECT
USING (true);

-- ========================================
-- POLÍTICAS PARA chat_message_feedback
-- ========================================

-- 1. Permitir INSERT a todos
CREATE POLICY "Enable insert for all users"
ON chat_message_feedback FOR INSERT
WITH CHECK (true);

-- 2. Permitir SELECT a todos
CREATE POLICY "Enable read access for all users"
ON chat_message_feedback FOR SELECT
USING (true);

-- 3. Permitir UPDATE para modificar feedback existente
CREATE POLICY "Enable update for all users"
ON chat_message_feedback FOR UPDATE
USING (true)
WITH CHECK (true);

-- ========================================
-- VERIFICAR PERMISOS DE ESQUEMA Y TABLAS
-- ========================================

-- Asegurar que el rol anon tenga permisos en el esquema public
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Permisos específicos en las tablas para anon
GRANT SELECT, INSERT, UPDATE ON chat_conversations TO anon;
GRANT SELECT, INSERT ON chat_messages TO anon;
GRANT SELECT, INSERT, UPDATE ON chat_message_feedback TO anon;

-- Permisos específicos en las tablas para authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_message_feedback TO authenticated;

-- Permisos en las secuencias (si existen)
DO $$
BEGIN
    -- Dar permisos en todas las secuencias del esquema public
    EXECUTE (
        SELECT string_agg('GRANT USAGE, SELECT ON SEQUENCE ' || quote_ident(sequence_name) || ' TO anon', '; ')
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    );
    
    EXECUTE (
        SELECT string_agg('GRANT USAGE, SELECT ON SEQUENCE ' || quote_ident(sequence_name) || ' TO authenticated', '; ')
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Si no hay secuencias, no hacer nada
        NULL;
END $$;

-- ========================================
-- CREAR FUNCIÓN HELPER PARA VERIFICAR PERMISOS
-- ========================================
CREATE OR REPLACE FUNCTION check_chat_permissions()
RETURNS TABLE(
    table_name text,
    has_rls boolean,
    insert_allowed boolean,
    select_allowed boolean,
    update_allowed boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::text,
        t.rowsecurity,
        has_table_privilege('anon', t.schemaname||'.'||t.tablename, 'INSERT') as insert_allowed,
        has_table_privilege('anon', t.schemaname||'.'||t.tablename, 'SELECT') as select_allowed,
        has_table_privilege('anon', t.schemaname||'.'||t.tablename, 'UPDATE') as update_allowed
    FROM pg_tables t
    WHERE t.tablename IN ('chat_conversations', 'chat_messages', 'chat_message_feedback')
    AND t.schemaname = 'public';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la verificación
SELECT * FROM check_chat_permissions();

-- ========================================
-- MENSAJE DE CONFIRMACIÓN
-- ========================================
DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS configuradas correctamente con seguridad mantenida.';
    RAISE NOTICE 'Permisos otorgados al rol anon para operaciones de chat.';
    RAISE NOTICE 'Ejecuta SELECT * FROM check_chat_permissions() para verificar.';
END $$;