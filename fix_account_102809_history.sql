-- SOLUCIÓN: Insertar snapshot de balance inicial para cuenta 102809
-- Esto corregirá los KPIs que están mal calculados

-- 1. Verificar balance history actual (debería estar vacío o con pocos puntos)
SELECT 
    timestamp,
    balance,
    equity,
    created_at
FROM account_balance_history abh
WHERE abh.account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
ORDER BY timestamp ASC;

-- 2. Insertar snapshot de balance INICIAL (antes de las operaciones)
-- Timestamp: 2025-10-30 07:37:00 (justo antes de las operaciones a las 07:37:09)
INSERT INTO account_balance_history (
    account_id,
    account_number,  -- ← CAMPO REQUERIDO
    balance,
    equity,
    margin,
    free_margin,
    profit_loss,
    timestamp,
    created_at
)
VALUES (
    'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a',  -- ID de la cuenta 102809
    '102809',    -- ← Account number (NOT NULL constraint)
    1000.00,     -- Balance inicial (antes de perder $0.10)
    1000.00,     -- Equity inicial
    0.00,        -- Sin margen usado
    1000.00,     -- Free margin = balance
    0.00,        -- Profit/loss inicial = 0
    '2025-10-30 07:36:00+00',  -- 1 minuto antes de las operaciones
    NOW()        -- Created at = ahora
);

-- 3. Verificar que se insertó correctamente
SELECT 
    timestamp,
    balance,
    equity,
    margin,
    free_margin,
    created_at
FROM account_balance_history abh
WHERE abh.account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
ORDER BY timestamp ASC;

-- 4. OPCIONAL: Forzar actualización del campo updated_at para trigger sync
UPDATE broker_accounts
SET updated_at = NOW()
WHERE login = 102809;

-- RESULTADO ESPERADO:
-- Después de ejecutar esto y esperar el próximo sync (5 min) o refrescar el frontend:
-- - Balance inicial: $1000.00 ✓
-- - Balance actual: $999.76 ✓
-- - Profit/Loss: $-0.24 (-0.024%) ✓
-- - Drawdown: $0.24 desde pico de $1000 ✓
-- - Balance history: 2+ puntos (inicial + actuales) ✓
