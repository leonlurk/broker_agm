-- Script para verificar tablas de chat/soporte en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- 1. Ver estructura de tablas de chat
SELECT 'TABLAS DE CHAT/SOPORTE' as info;

-- Verificar si existen las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'chat_conversations',
    'chat_messages',
    'support_tickets',
    'support_messages',
    'admin_interventions'
);

-- 2. Ver todas las conversaciones de chat
SELECT '--- CHAT_CONVERSATIONS ---' as section;
SELECT
    id,
    user_id,
    session_id,
    status,
    is_human_controlled,
    last_activity,
    created_at
FROM chat_conversations
ORDER BY created_at DESC
LIMIT 20;

-- 3. Ver mensajes de chat recientes
SELECT '--- CHAT_MESSAGES (últimos 50) ---' as section;
SELECT
    id,
    conversation_id,
    sender_type,
    sender_id,
    sender_name,
    LEFT(message, 100) as message_preview,
    intent,
    created_at
FROM chat_messages
ORDER BY created_at DESC
LIMIT 50;

-- 4. Ver tickets de soporte
SELECT '--- SUPPORT_TICKETS ---' as section;
SELECT
    id,
    user_id,
    user_email,
    user_name,
    status,
    last_message_at,
    created_at
FROM support_tickets
ORDER BY created_at DESC
LIMIT 20;

-- 5. Ver mensajes de soporte
SELECT '--- SUPPORT_MESSAGES (últimos 50) ---' as section;
SELECT
    id,
    ticket_id,
    sender_type,
    sender_id,
    sender_name,
    LEFT(content, 100) as content_preview,
    created_at
FROM support_messages
ORDER BY created_at DESC
LIMIT 50;

-- 6. Ver intervenciones de admin
SELECT '--- ADMIN_INTERVENTIONS ---' as section;
SELECT *
FROM admin_interventions
ORDER BY started_at DESC
LIMIT 20;

-- 7. Conteo de registros por tabla
SELECT '--- CONTEO DE REGISTROS ---' as section;
SELECT
    'chat_conversations' as tabla,
    COUNT(*) as total
FROM chat_conversations
UNION ALL
SELECT
    'chat_messages' as tabla,
    COUNT(*) as total
FROM chat_messages
UNION ALL
SELECT
    'support_tickets' as tabla,
    COUNT(*) as total
FROM support_tickets
UNION ALL
SELECT
    'support_messages' as tabla,
    COUNT(*) as total
FROM support_messages;

-- 8. Ver conversaciones con sus mensajes (JOIN)
SELECT '--- CONVERSACIONES CON MENSAJES ---' as section;
SELECT
    c.id as conversation_id,
    c.user_id,
    c.status,
    c.is_human_controlled,
    COUNT(m.id) as message_count,
    MAX(m.created_at) as last_message
FROM chat_conversations c
LEFT JOIN chat_messages m ON c.id = m.conversation_id
GROUP BY c.id, c.user_id, c.status, c.is_human_controlled
ORDER BY last_message DESC NULLS LAST
LIMIT 20;

-- 9. Buscar por user_id específico (reemplaza el UUID)
-- SELECT '--- BUSCAR POR USER_ID ---' as section;
-- SELECT * FROM chat_conversations WHERE user_id = 'TU-USER-ID-AQUI';
-- SELECT * FROM chat_messages WHERE conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = 'TU-USER-ID-AQUI');
