-- ========================================
-- VERIFICAR Y CORREGIR POLÍTICAS RLS (VERSIÓN CORREGIDA)
-- ========================================

-- 1. VER POLÍTICAS ACTUALES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('chat_conversations', 'chat_messages', 'chat_message_feedback');

-- 2. VER ESTADO DE RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('chat_conversations', 'chat_messages', 'chat_message_feedback');

-- 3. VER PERMISOS DEL ROL ANON
SELECT 
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
AND table_name IN ('chat_conversations', 'chat_messages', 'chat_message_feedback')
ORDER BY table_name, privilege_type;

-- ========================================
-- ARREGLAR POLÍTICAS Y PERMISOS
-- ========================================

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "allow_all_chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "allow_all_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "allow_all_chat_message_feedback" ON chat_message_feedback;
DROP POLICY IF EXISTS "Enable insert for all users" ON chat_conversations;
DROP POLICY IF EXISTS "Enable read access for all users" ON chat_conversations;
DROP POLICY IF EXISTS "Enable update for all users" ON chat_conversations;
DROP POLICY IF EXISTS "Enable insert for all users" ON chat_messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON chat_messages;
DROP POLICY IF EXISTS "Enable insert for all users" ON chat_message_feedback;
DROP POLICY IF EXISTS "Enable read access for all users" ON chat_message_feedback;
DROP POLICY IF EXISTS "Enable update for all users" ON chat_message_feedback;

-- Crear una única política permisiva para cada tabla
CREATE POLICY "allow_all_operations"
ON chat_conversations
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_operations"
ON chat_messages
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_operations"
ON chat_message_feedback
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Otorgar todos los permisos necesarios
GRANT ALL ON chat_conversations TO anon;
GRANT ALL ON chat_messages TO anon;
GRANT ALL ON chat_message_feedback TO anon;
GRANT ALL ON chat_conversations TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_message_feedback TO authenticated;

-- Asegurar permisos en el esquema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

-- Verificar políticas creadas
SELECT 
    tablename AS "Tabla",
    policyname AS "Política",
    cmd AS "Comando",
    permissive AS "Permisiva"
FROM pg_policies
WHERE tablename IN ('chat_conversations', 'chat_messages', 'chat_message_feedback')
ORDER BY tablename;

-- Verificar permisos
SELECT 
    'chat_conversations' AS tabla,
    has_table_privilege('anon', 'public.chat_conversations', 'INSERT') AS insert,
    has_table_privilege('anon', 'public.chat_conversations', 'SELECT') AS select,
    has_table_privilege('anon', 'public.chat_conversations', 'UPDATE') AS update,
    has_table_privilege('anon', 'public.chat_conversations', 'DELETE') AS delete
UNION ALL
SELECT 
    'chat_messages',
    has_table_privilege('anon', 'public.chat_messages', 'INSERT'),
    has_table_privilege('anon', 'public.chat_messages', 'SELECT'),
    has_table_privilege('anon', 'public.chat_messages', 'UPDATE'),
    has_table_privilege('anon', 'public.chat_messages', 'DELETE')
UNION ALL
SELECT 
    'chat_message_feedback',
    has_table_privilege('anon', 'public.chat_message_feedback', 'INSERT'),
    has_table_privilege('anon', 'public.chat_message_feedback', 'SELECT'),
    has_table_privilege('anon', 'public.chat_message_feedback', 'UPDATE'),
    has_table_privilege('anon', 'public.chat_message_feedback', 'DELETE')
ORDER BY tabla;