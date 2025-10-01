-- Query 1: Información básica de la cuenta
SELECT 
    login,
    balance,
    equity,
    created_at,
    updated_at,
    metadata->'initial_deposit' as initial_deposit
FROM broker_accounts 
WHERE login = 101347;

-- Query 2: Todas las operaciones cerradas (para calcular P&L)
SELECT 
    ticket,
    symbol,
    operation_type,
    volume,
    open_price,
    close_price,
    open_time,
    close_time,
    profit,
    commission,
    swap,
    status,
    EXTRACT(EPOCH FROM (close_time - open_time)) / 3600 as duration_hours
FROM trading_operations 
WHERE account_number = '101347'
    AND status = 'CLOSED'
ORDER BY close_time DESC;

-- Query 3: Estadísticas resumidas
SELECT 
    COUNT(*) as total_operations,
    COUNT(CASE WHEN profit > 0 THEN 1 END) as winning_trades,
    COUNT(CASE WHEN profit < 0 THEN 1 END) as losing_trades,
    COUNT(CASE WHEN profit = 0 THEN 1 END) as breakeven_trades,
    SUM(profit) as total_profit,
    SUM(commission) as total_commission,
    SUM(swap) as total_swap,
    AVG(CASE WHEN profit > 0 THEN profit END) as avg_win,
    AVG(CASE WHEN profit < 0 THEN profit END) as avg_loss,
    AVG(volume) as avg_volume,
    AVG(EXTRACT(EPOCH FROM (close_time - open_time)) / 3600) as avg_duration_hours
FROM trading_operations 
WHERE account_number = '101347'
    AND status = 'CLOSED';

-- Query 4: Balance history para calcular drawdown
SELECT 
    timestamp,
    balance,
    equity
FROM account_balance_history
WHERE account_number = '101347'
ORDER BY timestamp DESC
LIMIT 50;

-- Query 5: Instrumentos operados
SELECT 
    symbol,
    COUNT(*) as operations_count,
    SUM(profit) as total_profit_per_symbol,
    AVG(volume) as avg_volume
FROM trading_operations 
WHERE account_number = '101347'
    AND status = 'CLOSED'
GROUP BY symbol
ORDER BY operations_count DESC;
