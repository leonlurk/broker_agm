-- Verificar consistencia de datos históricos en cuentas MT5 existentes
-- Este script verifica si las cuentas antiguas tienen datos inconsistentes

-- 1. Verificar cuentas con datos históricos
SELECT 
    account_number,
    COUNT(*) as historical_snapshots,
    MIN(updated_at) as first_snapshot,
    MAX(updated_at) as last_snapshot,
    AVG(CASE WHEN balance = equity THEN 1.0 ELSE 0.0 END) * 100 as consistency_percentage
FROM broker_accounts 
WHERE updated_at IS NOT NULL
GROUP BY account_number
ORDER BY first_snapshot ASC;

-- 2. Verificar account_balance_history para inconsistencias
SELECT 
    account_number,
    COUNT(*) as history_records,
    COUNT(CASE WHEN balance = equity THEN 1 END) as consistent_records,
    COUNT(CASE WHEN balance != equity THEN 1 END) as inconsistent_records,
    MIN(timestamp) as oldest_record,
    MAX(timestamp) as newest_record
FROM account_balance_history 
GROUP BY account_number
ORDER BY oldest_record ASC;

-- 3. Identificar cuentas con posibles inconsistencias históricas
SELECT 
    ba.account_number,
    ba.balance as current_balance,
    ba.equity as current_equity,
    ba.updated_at as last_update,
    abh.avg_balance,
    abh.avg_equity,
    CASE 
        WHEN ba.balance = ba.equity THEN 'CONSISTENT'
        ELSE 'INCONSISTENT'
    END as current_status
FROM broker_accounts ba
LEFT JOIN (
    SELECT 
        account_number,
        AVG(balance) as avg_balance,
        AVG(equity) as avg_equity
    FROM account_balance_history 
    GROUP BY account_number
) abh ON ba.account_number = abh.account_number
ORDER BY ba.updated_at ASC;

-- 4. Verificar si hay cuentas con datos muy antiguos que podrían tener problemas
SELECT 
    account_number,
    balance,
    equity,
    margin,
    free_margin,
    updated_at,
    EXTRACT(DAYS FROM (NOW() - updated_at)) as days_since_update
FROM broker_accounts 
WHERE updated_at < NOW() - INTERVAL '7 days'
ORDER BY updated_at ASC;
