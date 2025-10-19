-- SOLUCIÓN URGENTE: Limpiar cola bloqueada
-- EJECUTA ESTO DESDE SUPABASE SQL EDITOR

-- 1. VER ESTRUCTURA DE TRADES ATASCADOS
SELECT 
    id,
    master_mt5_account_id,
    status,
    created_at,
    master_trade_details IS NULL as missing_trade_data,
    follower_accounts IS NULL as missing_followers,
    error_message,
    retry_count
FROM replication_queue
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour'
LIMIT 5;

-- 2. ELIMINAR TRADES HUÉRFANOS (sin datos para procesar)
-- SOLO EJECUTA ESTO DESPUÉS DE VERIFICAR EL QUERY #1
DELETE FROM replication_queue
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour'
  AND (
    master_trade_details IS NULL 
    OR follower_accounts IS NULL
    OR follower_accounts = '[]'::jsonb
  );

-- 3. MARCAR COMO FALLIDOS LOS QUE TIENEN MÁS DE 3 REINTENTOS
UPDATE replication_queue
SET status = 'failed',
    error_message = 'Expired after 17+ hours - stuck in queue'
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour'
  AND retry_count >= 3;

-- 4. RESETEAR TRADES RECIENTES VÁLIDOS (última hora) para reintento
UPDATE replication_queue
SET status = 'pending',
    retry_count = 0,
    processed_at = NULL,
    error_message = NULL
WHERE status IN ('processing', 'pending')
  AND created_at >= NOW() - INTERVAL '1 hour'
  AND master_trade_details IS NOT NULL
  AND follower_accounts IS NOT NULL;

-- 5. VERIFICAR RESULTADO FINAL
SELECT 
    status,
    COUNT(*) as count
FROM replication_queue
GROUP BY status
ORDER BY status;
