-- Script para verificar qué tablas históricas existen
-- Ejecuta este script en la consola SQL de Supabase

-- 1. Verificar qué tablas existen
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('account_balance_history', 'trading_operations', 'account_daily_metrics')
        THEN '✅ Existe'
        ELSE '❌ No existe'
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'account_balance_history', 
        'trading_operations', 
        'account_daily_metrics'
    )
ORDER BY table_name;

-- 2. Si las tablas existen, mostrar cuántos registros tienen
SELECT 
    'account_balance_history' as tabla,
    COUNT(*) as registros
FROM account_balance_history
UNION ALL
SELECT 
    'trading_operations' as tabla,
    COUNT(*) as registros
FROM trading_operations
UNION ALL
SELECT 
    'account_daily_metrics' as tabla,
    COUNT(*) as registros
FROM account_daily_metrics;

-- 3. Verificar si hay snapshots recientes (últimas 24 horas)
SELECT 
    account_number,
    balance,
    equity,
    timestamp
FROM account_balance_history
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 10;