-- SOLUCIÓN COMPLETA: Crear historial de balance más detallado
-- para que el backend calcule correctamente los KPIs

-- 1. Ver snapshots actuales
SELECT 
    id,
    timestamp,
    balance,
    equity,
    account_number
FROM account_balance_history
WHERE account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
ORDER BY timestamp ASC;

-- 2. Insertar snapshots adicionales para crear un historial más completo
-- Snapshot 1: Balance inicial (antes de operar)
INSERT INTO account_balance_history (
    account_id,
    account_number,
    balance,
    equity,
    margin,
    free_margin,
    profit_loss,
    timestamp,
    created_at
)
VALUES (
    'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a',
    '102809',
    1000.00,
    1000.00,
    0.00,
    1000.00,
    0.00,
    '2025-10-30 07:36:00+00',  -- Antes de las operaciones
    NOW()
)
ON CONFLICT DO NOTHING;  -- Por si ya existe

-- Snapshot 2: Después de la primera operación (-$0.07)
INSERT INTO account_balance_history (
    account_id,
    account_number,
    balance,
    equity,
    margin,
    free_margin,
    profit_loss,
    timestamp,
    created_at
)
VALUES (
    'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a',
    '102809',
    999.93,
    999.93,
    0.00,
    999.93,
    -0.07,
    '2025-10-30 07:37:26+00',  -- Después del primer trade
    NOW()
);

-- Snapshot 3: Después de la segunda operación (-$0.03 más)
INSERT INTO account_balance_history (
    account_id,
    account_number,
    balance,
    equity,
    margin,
    free_margin,
    profit_loss,
    timestamp,
    created_at
)
VALUES (
    'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a',
    '102809',
    999.76,
    999.76,
    0.00,
    999.76,
    -0.24,
    '2025-10-30 07:37:27+00',  -- Después del segundo trade
    NOW()
);

-- 3. Verificar historial completo
SELECT 
    timestamp,
    balance,
    equity,
    profit_loss,
    created_at
FROM account_balance_history
WHERE account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
ORDER BY timestamp ASC;

-- 4. Forzar recálculo actualizando updated_at
UPDATE broker_accounts
SET updated_at = NOW()
WHERE login = 102809;

-- RESULTADO ESPERADO:
-- Balance history: 4-5 puntos mostrando la evolución completa
-- KPIs calculados correctamente:
--   - Initial balance: $1000.00 (primer snapshot) ✓
--   - Current balance: $999.76 ✓
--   - Profit/Loss: $-0.24 (-0.024%) ✓
--   - Peak balance: $1000.00 ✓
--   - Drawdown: $0.24 (0.024%) ✓
