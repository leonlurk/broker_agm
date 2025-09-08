-- ========================================
-- VERIFICAR ESTRUCTURA EXACTA DE LA TABLA
-- ========================================

-- 1. Ver TODAS las columnas de chat_conversations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_conversations'
ORDER BY ordinal_position;

-- 2. Ver si existen las columnas problemáticas
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'chat_conversations' 
            AND column_name = 'controlled_at'
        ) THEN 'controlled_at EXISTS'
        ELSE 'controlled_at DOES NOT EXIST'
    END as controlled_at_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'chat_conversations' 
            AND column_name = 'last_activity'
        ) THEN 'last_activity EXISTS'
        ELSE 'last_activity DOES NOT EXIST'
    END as last_activity_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'chat_conversations' 
            AND column_name = 'is_human_controlled'
        ) THEN 'is_human_controlled EXISTS'
        ELSE 'is_human_controlled DOES NOT EXIST'
    END as is_human_controlled_status;

-- 3. Agregar columnas faltantes si no existen
DO $$ 
BEGIN
    -- Agregar is_human_controlled si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_conversations' 
        AND column_name = 'is_human_controlled'
    ) THEN
        ALTER TABLE chat_conversations 
        ADD COLUMN is_human_controlled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added column: is_human_controlled';
    END IF;

    -- Agregar last_activity si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_conversations' 
        AND column_name = 'last_activity'
    ) THEN
        ALTER TABLE chat_conversations 
        ADD COLUMN last_activity TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added column: last_activity';
    END IF;
END $$;

-- 4. Verificar estructura final
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_conversations'
ORDER BY ordinal_position;

-- 5. Probar un UPDATE simple para verificar que funciona
UPDATE chat_conversations 
SET 
    is_human_controlled = false,
    last_activity = NOW()
WHERE id = (SELECT id FROM chat_conversations LIMIT 1)
RETURNING *;