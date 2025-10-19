-- Verificar si los trades del master realmente se copiaron al follower
-- EJECUTA ESTO DESDE SUPABASE SQL EDITOR

-- 1. Ver relación activa de copy trading
SELECT 
    id,
    master_user_id,
    master_mt5_account_id,
    follower_user_id,
    follower_mt5_account_id,
    status,
    created_at
FROM copy_relationships
WHERE master_mt5_account_id = '101308' 
   OR follower_mt5_account_id = '101290';

-- 2. Ver estado actual de la cola de replicación (últimos 10)
SELECT 
    id,
    master_mt5_account_id,
    status,
    created_at,
    processed_at,
    completed_at,
    error_message,
    trade_data->>'symbol' as symbol,
    trade_data->>'action' as action
FROM replication_queue
WHERE master_mt5_account_id = '101308'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Contar trades por estado
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM replication_queue
WHERE master_mt5_account_id = '101308'
GROUP BY status;

-- 4. Ver trades procesados exitosamente (si existen)
SELECT 
    id,
    status,
    created_at,
    completed_at,
    (completed_at - created_at) as processing_time,
    trade_data->>'symbol' as symbol,
    trade_data->>'action' as action
FROM replication_queue
WHERE master_mt5_account_id = '101308'
  AND status = 'completed'
ORDER BY completed_at DESC
LIMIT 5;
