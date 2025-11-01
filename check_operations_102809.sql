-- Verificar operaciones completas de la cuenta 102809
-- para identificar la discrepancia de $0.14

-- 1. Ver todas las operaciones con TODOS los campos
SELECT 
    ticket,
    symbol,
    operation_type,
    volume,
    open_price,
    close_price,
    profit,
    swap,           -- ← Puede tener costos
    commission,     -- ← Puede tener costos
    open_time,
    close_time,
    comment
FROM trading_operations
WHERE account_number = '102809'
ORDER BY close_time ASC;

-- 2. Calcular totales de profit, swap y commission
SELECT 
    COUNT(*) as total_operations,
    SUM(profit) as total_profit,
    SUM(swap) as total_swap,
    SUM(commission) as total_commission,
    SUM(profit) + SUM(swap) + SUM(commission) as total_pnl
FROM trading_operations
WHERE account_number = '102809';

-- 3. Ver balance history completo
SELECT 
    timestamp,
    balance,
    equity,
    profit_loss,
    created_at
FROM account_balance_history
WHERE account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
ORDER BY timestamp ASC;

-- 4. Verificar si hay transacciones adicionales (depósitos/retiros/ajustes)
SELECT 
    *
FROM account_transactions
WHERE account_id = 'd9de165f-2e4a-4b8a-9a4d-1fdfdc4a945a'
ORDER BY created_at ASC;

-- ANÁLISIS ESPERADO:
-- Si profit = -$0.10 pero balance cayó -$0.24, entonces:
-- - Swap + Commission = -$0.14 adicionales
-- O hay operaciones/transacciones no registradas
