-- Actualizar la relación existente con master_mt5_account_id
-- EJECUTAR EN SUPABASE

-- Verificar relación actual
SELECT 
    id,
    master_user_id,
    follower_user_id,
    master_mt5_account_id,
    follower_mt5_account_id,
    status
FROM copy_relationships
WHERE status = 'active';

-- Actualizar con el master_mt5_account_id correcto
-- Basado en los logs: master_user_id 'dfe5c068-bddf-419d-b816-08303dd276ea' es cuenta MT5 101308
UPDATE copy_relationships
SET 
    master_mt5_account_id = '101308',
    updated_at = NOW()
WHERE 
    master_user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea'
    AND status = 'active';

-- Verificar resultado
SELECT 
    id,
    master_user_id,
    follower_user_id,
    master_mt5_account_id,
    follower_mt5_account_id,
    status,
    risk_ratio
FROM copy_relationships
WHERE status = 'active';
