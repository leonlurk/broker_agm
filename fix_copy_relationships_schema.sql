-- Fix copy_relationships schema to match backend expectations
-- EJECUTAR EN SUPABASE

-- 1. Renombrar columnas si la tabla existe
DO $$ 
BEGIN
    -- Renombrar master_id a master_user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'copy_relationships' 
        AND column_name = 'master_id'
    ) THEN
        ALTER TABLE copy_relationships RENAME COLUMN master_id TO master_user_id;
    END IF;
    
    -- Renombrar follower_id a follower_user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'copy_relationships' 
        AND column_name = 'follower_id'
    ) THEN
        ALTER TABLE copy_relationships RENAME COLUMN follower_id TO follower_user_id;
    END IF;
    
    -- Agregar master_mt5_account_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'copy_relationships' 
        AND column_name = 'master_mt5_account_id'
    ) THEN
        ALTER TABLE copy_relationships ADD COLUMN master_mt5_account_id BIGINT;
    END IF;
END $$;

-- 2. Actualizar constraints y foreign keys
ALTER TABLE copy_relationships DROP CONSTRAINT IF EXISTS copy_relationships_master_id_fkey;
ALTER TABLE copy_relationships DROP CONSTRAINT IF EXISTS copy_relationships_follower_id_fkey;
ALTER TABLE copy_relationships DROP CONSTRAINT IF EXISTS copy_relationships_master_id_follower_id_key;
ALTER TABLE copy_relationships DROP CONSTRAINT IF EXISTS copy_relationships_check;

-- Recrear constraints con nombres correctos
ALTER TABLE copy_relationships 
    ADD CONSTRAINT copy_relationships_master_user_id_fkey 
    FOREIGN KEY (master_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE copy_relationships 
    ADD CONSTRAINT copy_relationships_follower_user_id_fkey 
    FOREIGN KEY (follower_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE copy_relationships 
    ADD CONSTRAINT copy_relationships_master_follower_unique 
    UNIQUE(master_user_id, follower_user_id);

ALTER TABLE copy_relationships 
    ADD CONSTRAINT copy_relationships_no_self_follow 
    CHECK (master_user_id != follower_user_id);

-- 3. Actualizar índices
DROP INDEX IF EXISTS idx_copy_relationships_master_id;
DROP INDEX IF EXISTS idx_copy_relationships_follower_id;

CREATE INDEX IF NOT EXISTS idx_copy_relationships_master_user_id ON copy_relationships(master_user_id);
CREATE INDEX IF NOT EXISTS idx_copy_relationships_follower_user_id ON copy_relationships(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_copy_relationships_master_mt5 ON copy_relationships(master_mt5_account_id);

-- 4. Actualizar RLS policies
DROP POLICY IF EXISTS "Users can view their own copy relationships" ON copy_relationships;
DROP POLICY IF EXISTS "Users can create relationships as follower" ON copy_relationships;
DROP POLICY IF EXISTS "Users can update their own relationships" ON copy_relationships;
DROP POLICY IF EXISTS "Users can delete their own relationships" ON copy_relationships;

CREATE POLICY "Users can view their own copy relationships" ON copy_relationships
    FOR SELECT USING (
        auth.uid() = master_user_id OR 
        auth.uid() = follower_user_id
    );

CREATE POLICY "Users can create relationships as follower" ON copy_relationships
    FOR INSERT WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Users can update their own relationships" ON copy_relationships
    FOR UPDATE USING (
        auth.uid() = master_user_id OR 
        auth.uid() = follower_user_id
    );

CREATE POLICY "Users can delete their own relationships" ON copy_relationships
    FOR DELETE USING (
        auth.uid() = master_user_id OR 
        auth.uid() = follower_user_id
    );

-- 5. Verificar resultado
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'copy_relationships'
ORDER BY ordinal_position;
