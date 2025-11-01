-- SOLUCIÓN FINAL: Eliminar el snapshot incorrecto de $0
-- y dejar solo el snapshot correcto de $1000

-- 1. Ver todos los snapshots actuales
SELECT 
    id,
    timestamp,
    balance,
    equity,
    created_at
FROM account_balance_history abh
WHERE abh.account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
ORDER BY timestamp ASC;

-- 2. ELIMINAR el snapshot incorrecto de $0 (el primero)
DELETE FROM account_balance_history
WHERE account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
AND timestamp = '2025-10-30 05:29:01.662182+00'
AND balance = 0.00;

-- 3. Verificar que quedaron solo 2 snapshots correctos
SELECT 
    id,
    timestamp,
    balance,
    equity,
    created_at
FROM account_balance_history abh
WHERE abh.account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
ORDER BY timestamp ASC;

-- 4. OPCIONAL: Forzar recálculo actualizando updated_at
UPDATE broker_accounts
SET updated_at = NOW()
WHERE login = 102809;

-- RESULTADO ESPERADO:
-- Balance history:
--   1. 2025-10-30 07:36:00 → $1000.00 (inicial) ✓
--   2. 2025-10-31 21:30:31 → $999.76 (actual) ✓
--
-- KPIs corregidos:
--   - Initial balance: $1000.00 ✓
--   - Current balance: $999.76 ✓
--   - Profit/Loss: $-0.24 (-0.024%) ✓
--   - Drawdown: $0.24 (0.024%) ✓
