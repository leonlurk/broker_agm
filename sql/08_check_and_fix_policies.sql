-- ========================================
-- VERIFICAR Y CORREGIR POLÍTICAS RLS
-- ========================================

-- 1. PRIMERO, VEAMOS QUÉ POLÍTICAS EXISTEN ACTUALMENTE
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('chat_conversations', 'chat_messages', 'chat_message_feedback')
ORDER BY tablename, policyname;

-- 2. VERIFICAR EL ESTADO DE RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('chat_conversations', 'chat_messages', 'chat_message_feedback');

-- 3. VERIFICAR PERMISOS DEL ROL ANON
SELECT 
    tablename,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
AND table_name IN ('chat_conversations', 'chat_messages', 'chat_message_feedback')
ORDER BY tablename, privilege_type;

-- ========================================
-- AHORA, VAMOS A ARREGLARLO DEFINITIVAMENTE
-- ========================================

-- Paso 1: Eliminar TODAS las políticas existentes
DO $$ 
DECLARE
    r record;
BEGIN
    FOR r IN 
        SELECT policyname, tablename
        FROM pg_policies 
        WHERE tablename IN ('chat_conversations', 'chat_messages', 'chat_message_feedback')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
        RAISE NOTICE 'Eliminada política: % en tabla %', r.policyname, r.tablename;
    END LOOP;
END $$;

-- Paso 2: Crear políticas simples y permisivas que DEFINITIVAMENTE funcionen
-- IMPORTANTE: Usamos "true" directamente sin condiciones

-- Para chat_conversations
CREATE POLICY "allow_all_chat_conversations"
ON chat_conversations
AS PERMISSIVE
FOR ALL
TO public  -- Nota: usamos "public" que incluye anon y authenticated
USING (true)
WITH CHECK (true);

-- Para chat_messages  
CREATE POLICY "allow_all_chat_messages"
ON chat_messages
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Para chat_message_feedback
CREATE POLICY "allow_all_chat_message_feedback"
ON chat_message_feedback
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Paso 3: Asegurar que los GRANTS estén correctos
-- Revocar primero para empezar limpio
REVOKE ALL ON chat_conversations FROM anon CASCADE;
REVOKE ALL ON chat_messages FROM anon CASCADE;
REVOKE ALL ON chat_message_feedback FROM anon CASCADE;

-- Ahora otorgar permisos completos
GRANT ALL ON chat_conversations TO anon;
GRANT ALL ON chat_messages TO anon;
GRANT ALL ON chat_message_feedback TO anon;

-- También para authenticated
GRANT ALL ON chat_conversations TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_message_feedback TO authenticated;

-- Paso 4: Asegurar permisos en el esquema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT CREATE ON SCHEMA public TO anon;
GRANT CREATE ON SCHEMA public TO authenticated;

-- Paso 5: Verificar que todo esté correcto
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONFIGURACIÓN COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Las políticas han sido recreadas.';
    RAISE NOTICE 'Los permisos han sido otorgados.';
    RAISE NOTICE '';
    RAISE NOTICE 'Para verificar, ejecuta estas consultas:';
    RAISE NOTICE '1. SELECT * FROM pg_policies WHERE tablename LIKE ''chat_%'';';
    RAISE NOTICE '2. SELECT has_table_privilege(''anon'', ''chat_conversations'', ''INSERT'');';
    RAISE NOTICE '========================================';
END $$;

-- Verificación final: mostrar las nuevas políticas
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('chat_conversations', 'chat_messages', 'chat_message_feedback')
ORDER BY tablename;

-- Verificar permisos del rol anon
SELECT 
    'chat_conversations' as table_name,
    has_table_privilege('anon', 'chat_conversations', 'INSERT') as can_insert,
    has_table_privilege('anon', 'chat_conversations', 'SELECT') as can_select,
    has_table_privilege('anon', 'chat_conversations', 'UPDATE') as can_update,
    has_table_privilege('anon', 'chat_conversations', 'DELETE') as can_delete
UNION ALL
SELECT 
    'chat_messages',
    has_table_privilege('anon', 'chat_messages', 'INSERT'),
    has_table_privilege('anon', 'chat_messages', 'SELECT'),
    has_table_privilege('anon', 'chat_messages', 'UPDATE'),
    has_table_privilege('anon', 'chat_messages', 'DELETE')
UNION ALL
SELECT 
    'chat_message_feedback',
    has_table_privilege('anon', 'chat_message_feedback', 'INSERT'),
    has_table_privilege('anon', 'chat_message_feedback', 'SELECT'),
    has_table_privilege('anon', 'chat_message_feedback', 'UPDATE'),
    has_table_privilege('anon', 'chat_message_feedback', 'DELETE');