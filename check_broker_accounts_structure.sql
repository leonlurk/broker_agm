-- Verificar estructura completa de broker_accounts
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'broker_accounts'
ORDER BY ordinal_position;

-- Ver datos de la cuenta 102809
SELECT 
    id,
    login,
    user_id,
    balance,
    equity,
    margin,
    free_margin,
    created_at,
    updated_at,
    status
FROM broker_accounts
WHERE login = '102809';

-- Ver balance history de la cuenta
SELECT 
    timestamp,
    balance,
    equity,
    created_at
FROM account_balance_history abh
JOIN broker_accounts ba ON ba.id = abh.account_id
WHERE ba.login = '102809'
ORDER BY timestamp ASC
LIMIT 10;

-- Ver operaciones de la cuenta
SELECT 
    ticket,
    symbol,
    operation_type,
    volume,
    profit,
    open_time,
    close_time
FROM trading_operations
WHERE account_number = '102809'
ORDER BY close_time ASC;
