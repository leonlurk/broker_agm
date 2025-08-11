-- ==============================================
-- VERIFICACIÓN COMPLETA DEL SISTEMA
-- ==============================================
-- Ejecuta este script en Supabase SQL Editor para verificar que todo está listo

-- 1. VERIFICAR TABLAS EXISTENTES
-- ----------------------------------------------
WITH table_check AS (
    SELECT 
        'account_balance_history' as required_table
    UNION ALL
    SELECT 'trading_operations'
    UNION ALL
    SELECT 'account_daily_metrics'
)
SELECT 
    tc.required_table as tabla,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Falta - Ejecuta historical_tables_safe.sql'
    END as estado
FROM table_check tc
LEFT JOIN information_schema.tables t 
    ON t.table_name = tc.required_table 
    AND t.table_schema = 'public'
ORDER BY tc.required_table;

-- 2. CONTAR REGISTROS EN CADA TABLA
-- ----------------------------------------------
DO $$
DECLARE
    v_balance_count INTEGER;
    v_operations_count INTEGER;
    v_metrics_count INTEGER;
BEGIN
    -- Contar registros solo si las tablas existen
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_balance_history') THEN
        SELECT COUNT(*) INTO v_balance_count FROM account_balance_history;
        RAISE NOTICE 'account_balance_history: % registros', v_balance_count;
    ELSE
        RAISE NOTICE 'account_balance_history: TABLA NO EXISTE';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trading_operations') THEN
        SELECT COUNT(*) INTO v_operations_count FROM trading_operations;
        RAISE NOTICE 'trading_operations: % registros', v_operations_count;
    ELSE
        RAISE NOTICE 'trading_operations: TABLA NO EXISTE';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_daily_metrics') THEN
        SELECT COUNT(*) INTO v_metrics_count FROM account_daily_metrics;
        RAISE NOTICE 'account_daily_metrics: % registros', v_metrics_count;
    ELSE
        RAISE NOTICE 'account_daily_metrics: TABLA NO EXISTE';
    END IF;
END $$;

-- 3. VERIFICAR SNAPSHOTS RECIENTES
-- ----------------------------------------------
-- Muestra los últimos 5 snapshots de balance
SELECT 
    'Últimos Snapshots' as seccion,
    account_number,
    balance,
    equity,
    timestamp::text as fecha_hora
FROM account_balance_history
ORDER BY timestamp DESC
LIMIT 5;

-- 4. VERIFICAR CUENTAS SIN SNAPSHOTS
-- ----------------------------------------------
-- Identifica cuentas que tienen balance pero no tienen snapshots
SELECT 
    'Cuentas sin snapshots' as estado,
    ta.account_number,
    ta.account_name,
    ta.balance
FROM trading_accounts ta
WHERE ta.balance > 0
  AND NOT EXISTS (
    SELECT 1 
    FROM account_balance_history abh 
    WHERE abh.account_number = ta.account_number
  );

-- 5. RESUMEN DE ESTADO
-- ----------------------------------------------
SELECT 
    'RESUMEN DEL SISTEMA' as titulo,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_name IN ('account_balance_history', 'trading_operations', 'account_daily_metrics')
        ) = 3 
        THEN '✅ Todas las tablas existen'
        ELSE '⚠️ Faltan tablas - Ejecuta historical_tables_safe.sql'
    END as estado_tablas,
    CASE 
        WHEN EXISTS (SELECT 1 FROM account_balance_history LIMIT 1)
        THEN '✅ Hay datos históricos'
        ELSE '⚠️ No hay datos históricos aún'
    END as estado_datos;

-- 6. INSTRUCCIONES SI FALTAN TABLAS
-- ----------------------------------------------
SELECT 
    '📝 INSTRUCCIONES' as titulo,
    'Si faltan tablas, ejecuta el archivo: src/sql/historical_tables_safe.sql' as paso_1,
    'Este creará las tablas, índices y políticas RLS automáticamente' as paso_2,
    'Los snapshots iniciales se crearán automáticamente' as paso_3;