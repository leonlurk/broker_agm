-- ========================================
-- VERIFICAR ESTRUCTURA DE TABLAS DE CHAT EXISTENTES
-- ========================================
-- Ejecuta este SQL primero para ver qué ya existe

-- 1. Ver estructura de chat_conversations si existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'chat_conversations'
ORDER BY ordinal_position;

-- 2. Ver estructura de chat_messages si existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'chat_messages'
ORDER BY ordinal_position;

-- 3. Ver estructura de chat_context si existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'chat_context'
ORDER BY ordinal_position;

-- 4. Verificar qué tablas de chat existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE 'chat_%'
ORDER BY table_name;