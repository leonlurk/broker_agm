-- ELIMINAR snapshot duplicado y dejar solo el historial correcto

-- 1. Ver todos los snapshots (identificar duplicados)
SELECT 
    id,
    timestamp,
    balance,
    equity,
    profit_loss,
    created_at
FROM account_balance_history
WHERE account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
ORDER BY timestamp ASC, created_at ASC;

-- 2. ELIMINAR el snapshot duplicado (el más antiguo)
DELETE FROM account_balance_history
WHERE account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
AND timestamp = '2025-10-30 07:36:00+00'
AND created_at = '2025-10-31 22:05:25.338584+00';  -- El más antiguo

-- 3. Verificar que quedó solo 1 snapshot por timestamp
SELECT 
    timestamp,
    balance,
    equity,
    profit_loss,
    created_at
FROM account_balance_history
WHERE account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
ORDER BY timestamp ASC;

-- 4. Forzar recálculo
UPDATE broker_accounts
SET updated_at = NOW()
WHERE login = 102809;

-- RESULTADO ESPERADO:
-- 4 snapshots únicos:
--   1. 2025-10-30 07:36:00 → $1000.00 (inicial) ✓
--   2. 2025-10-30 07:37:26 → $999.93 (después 1er trade) ✓
--   3. 2025-10-30 07:37:27 → $999.76 (después 2do trade) ✓
--   4. 2025-10-31 21:30:31 → $999.76 (sync actual) ✓
