-- Verificar estado de la cola de replicación
-- EJECUTA ESTO DESDE SUPABASE SQL EDITOR

-- 1. Ver todos los trades en cola
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM replication_queue
GROUP BY status
ORDER BY status;

-- 2. Ver los 20 trades más recientes
SELECT 
    id,
    master_mt5_account_id,
    status,
    created_at,
    processed_at,
    completed_at,
    retry_count,
    error_message
FROM replication_queue
ORDER BY created_at DESC
LIMIT 20;

-- 3. Ver trades pendientes hace más de 5 minutos
SELECT 
    id,
    master_mt5_account_id,
    status,
    created_at,
    NOW() - created_at as age
FROM replication_queue
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '5 minutes'
ORDER BY created_at ASC;

-- 4. LIMPIAR TRADES DUPLICADOS (ejecutar con cuidado)
-- Eliminar trades completados hace más de 1 hora
DELETE FROM replication_queue
WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '1 hour';

-- Eliminar trades fallidos hace más de 1 hora
DELETE FROM replication_queue
WHERE status = 'failed'
  AND created_at < NOW() - INTERVAL '1 hour';
