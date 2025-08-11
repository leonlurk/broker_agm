-- Insertar snapshot inicial para cuentas existentes con balance
-- Este script crea un registro histórico inicial para las cuentas que ya tienen balance

-- Primero, veamos las cuentas existentes
SELECT 
    id,
    user_id,
    account_number,
    account_name,
    balance,
    equity,
    margin,
    free_margin
FROM trading_accounts
WHERE balance > 0;

-- Insertar snapshots iniciales para todas las cuentas con balance
INSERT INTO account_balance_history (
    account_id,
    account_number,
    balance,
    equity,
    margin,
    free_margin,
    profit_loss,
    timestamp
)
SELECT 
    id::TEXT as account_id,
    account_number,
    COALESCE(balance, 0) as balance,
    COALESCE(equity, balance, 0) as equity,
    COALESCE(margin, 0) as margin,
    COALESCE(free_margin, balance, 0) as free_margin,
    0 as profit_loss,
    NOW() as timestamp
FROM trading_accounts
WHERE balance > 0
  AND NOT EXISTS (
    -- Solo insertar si no hay snapshots previos
    SELECT 1 
    FROM account_balance_history abh 
    WHERE abh.account_number = trading_accounts.account_number
  );

-- Verificar que se insertaron los snapshots
SELECT 
    abh.account_number,
    abh.balance,
    abh.equity,
    abh.timestamp,
    ta.account_name
FROM account_balance_history abh
JOIN trading_accounts ta ON ta.account_number = abh.account_number
ORDER BY abh.timestamp DESC;