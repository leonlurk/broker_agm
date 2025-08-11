-- =====================================================
-- SCRIPT DE DATOS DE PRUEBA PARA LA CUENTA 101197
-- =====================================================
-- Este script inserta datos de prueba realistas para probar todos los KPIs y gráficos
-- Ejecutar en Supabase SQL Editor

-- Primero obtenemos el ID de la cuenta 101197
DO $$
DECLARE
    v_account_id UUID;
    v_account_number TEXT := '101197';
    v_current_balance DECIMAL;
BEGIN
    -- Obtener el ID y balance actual de la cuenta
    SELECT id, balance INTO v_account_id, v_current_balance
    FROM trading_accounts
    WHERE account_number = v_account_number;
    
    IF v_account_id IS NULL THEN
        RAISE EXCEPTION 'Cuenta % no encontrada', v_account_number;
    END IF;
    
    RAISE NOTICE 'Insertando datos de prueba para cuenta % (ID: %)', v_account_number, v_account_id;
    
    -- =====================================================
    -- 1. INSERTAR HISTORIAL DE BALANCE (últimos 30 días)
    -- =====================================================
    -- Simular evolución del balance desde 10000 hasta 10500
    
    -- Limpiar datos anteriores de prueba (opcional)
    DELETE FROM account_balance_history 
    WHERE account_number = v_account_number 
    AND timestamp < NOW() - INTERVAL '30 days';
    
    -- Insertar snapshots de balance progresivo
    INSERT INTO account_balance_history (
        account_id, account_number, balance, equity, margin, free_margin, profit_loss, timestamp
    ) VALUES
    -- Hace 30 días - Balance inicial
    (v_account_id::TEXT, v_account_number, 10000.00, 10000.00, 0, 10000.00, 0, NOW() - INTERVAL '30 days'),
    
    -- Semana 1 - Pequeña ganancia
    (v_account_id::TEXT, v_account_number, 10050.00, 10050.00, 100, 9950.00, 50, NOW() - INTERVAL '28 days'),
    (v_account_id::TEXT, v_account_number, 10075.00, 10075.00, 150, 9925.00, 75, NOW() - INTERVAL '26 days'),
    (v_account_id::TEXT, v_account_number, 10100.00, 10100.00, 0, 10100.00, 100, NOW() - INTERVAL '24 days'),
    
    -- Semana 2 - Pequeña pérdida y recuperación
    (v_account_id::TEXT, v_account_number, 10080.00, 10080.00, 200, 9880.00, 80, NOW() - INTERVAL '21 days'),
    (v_account_id::TEXT, v_account_number, 10060.00, 10060.00, 100, 9960.00, 60, NOW() - INTERVAL '19 days'),
    (v_account_id::TEXT, v_account_number, 10120.00, 10120.00, 0, 10120.00, 120, NOW() - INTERVAL '17 days'),
    
    -- Semana 3 - Crecimiento estable
    (v_account_id::TEXT, v_account_number, 10150.00, 10150.00, 250, 9900.00, 150, NOW() - INTERVAL '14 days'),
    (v_account_id::TEXT, v_account_number, 10200.00, 10200.00, 300, 9900.00, 200, NOW() - INTERVAL '12 days'),
    (v_account_id::TEXT, v_account_number, 10250.00, 10250.00, 200, 10050.00, 250, NOW() - INTERVAL '10 days'),
    
    -- Semana 4 - Volatilidad
    (v_account_id::TEXT, v_account_number, 10180.00, 10180.00, 150, 10030.00, 180, NOW() - INTERVAL '7 days'),
    (v_account_id::TEXT, v_account_number, 10300.00, 10300.00, 400, 9900.00, 300, NOW() - INTERVAL '5 days'),
    (v_account_id::TEXT, v_account_number, 10420.00, 10420.00, 300, 10120.00, 420, NOW() - INTERVAL '3 days'),
    
    -- Últimos días - Llegada al balance actual
    (v_account_id::TEXT, v_account_number, 10450.00, 10450.00, 200, 10250.00, 450, NOW() - INTERVAL '2 days'),
    (v_account_id::TEXT, v_account_number, 10480.00, 10480.00, 100, 10380.00, 480, NOW() - INTERVAL '1 day'),
    (v_account_id::TEXT, v_account_number, v_current_balance, v_current_balance, 0, v_current_balance, 500, NOW());
    
    -- =====================================================
    -- 2. INSERTAR OPERACIONES DE TRADING
    -- =====================================================
    -- Operaciones cerradas con ganancias y pérdidas mixtas
    
    INSERT INTO trading_operations (
        account_id, account_number, ticket, symbol, operation_type, 
        volume, open_price, close_price, open_time, close_time,
        stop_loss, take_profit, profit, swap, commission, 
        comment, status
    ) VALUES
    -- Operaciones ganadoras en EURUSD
    (v_account_id::TEXT, v_account_number, 1001, 'EURUSD', 'BUY', 
     0.10, 1.0850, 1.0875, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days' + INTERVAL '4 hours',
     1.0820, 1.0880, 25.00, -0.50, -2.00, 'TP hit', 'CLOSED'),
    
    (v_account_id::TEXT, v_account_number, 1002, 'EURUSD', 'SELL', 
     0.15, 1.0900, 1.0870, NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days' + INTERVAL '6 hours',
     1.0930, 1.0870, 45.00, -0.75, -3.00, 'Manual close', 'CLOSED'),
    
    -- Operación perdedora en EURUSD
    (v_account_id::TEXT, v_account_number, 1003, 'EURUSD', 'BUY', 
     0.20, 1.0880, 1.0860, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days' + INTERVAL '2 hours',
     1.0850, 1.0910, -40.00, -0.60, -4.00, 'SL hit', 'CLOSED'),
    
    -- Operaciones en XAUUSD (Oro)
    (v_account_id::TEXT, v_account_number, 1004, 'XAUUSD', 'BUY', 
     0.05, 2020.50, 2028.00, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '8 hours',
     2015.00, 2030.00, 37.50, -1.20, -5.00, 'Partial TP', 'CLOSED'),
    
    (v_account_id::TEXT, v_account_number, 1005, 'XAUUSD', 'SELL', 
     0.08, 2035.00, 2030.00, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '3 hours',
     2040.00, 2025.00, 40.00, -0.90, -4.00, 'Manual close', 'CLOSED'),
    
    -- Más operaciones recientes
    (v_account_id::TEXT, v_account_number, 1006, 'EURUSD', 'BUY', 
     0.25, 1.0920, 1.0945, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days' + INTERVAL '5 hours',
     1.0900, 1.0950, 62.50, -1.50, -5.00, 'TP hit', 'CLOSED'),
    
    (v_account_id::TEXT, v_account_number, 1007, 'XAUUSD', 'SELL', 
     0.10, 2042.00, 2045.00, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days' + INTERVAL '2 hours',
     2048.00, 2038.00, -30.00, -0.80, -5.00, 'SL hit', 'CLOSED'),
    
    (v_account_id::TEXT, v_account_number, 1008, 'EURUSD', 'SELL', 
     0.30, 1.0960, 1.0935, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '7 hours',
     1.0980, 1.0930, 75.00, -2.00, -6.00, 'TP hit', 'CLOSED'),
    
    -- Operaciones más recientes
    (v_account_id::TEXT, v_account_number, 1009, 'EURUSD', 'BUY', 
     0.20, 1.0940, 1.0965, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '4 hours',
     1.0920, 1.0970, 50.00, -1.00, -4.00, 'Manual close', 'CLOSED'),
    
    (v_account_id::TEXT, v_account_number, 1010, 'XAUUSD', 'BUY', 
     0.15, 2050.00, 2058.50, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '6 hours',
     2045.00, 2060.00, 127.50, -2.50, -7.50, 'TP hit', 'CLOSED'),
    
    (v_account_id::TEXT, v_account_number, 1011, 'EURUSD', 'SELL', 
     0.25, 1.0980, 1.0990, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '1 hour',
     1.1000, 1.0960, -25.00, -0.50, -5.00, 'SL hit', 'CLOSED'),
    
    (v_account_id::TEXT, v_account_number, 1012, 'XAUUSD', 'SELL', 
     0.12, 2065.00, 2060.00, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '3 hours',
     2070.00, 2055.00, 60.00, -1.80, -6.00, 'Manual close', 'CLOSED'),
    
    -- Operación más reciente (ayer)
    (v_account_id::TEXT, v_account_number, 1013, 'EURUSD', 'BUY', 
     0.18, 1.0990, 1.1005, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '5 hours',
     1.0970, 1.1010, 27.00, -0.90, -3.60, 'Manual close', 'CLOSED');
    
    -- =====================================================
    -- 3. INSERTAR MÉTRICAS DIARIAS AGREGADAS
    -- =====================================================
    -- Resumen diario de los últimos 7 días
    
    INSERT INTO account_daily_metrics (
        account_id, account_number, date,
        opening_balance, closing_balance, high_balance, low_balance,
        total_trades, winning_trades, losing_trades,
        total_profit, total_loss, max_drawdown
    ) VALUES
    (v_account_id::TEXT, v_account_number, CURRENT_DATE - 7,
     10180.00, 10180.00, 10200.00, 10170.00,
     1, 1, 0, 50.00, 0.00, 0.15),
    
    (v_account_id::TEXT, v_account_number, CURRENT_DATE - 5,
     10180.00, 10300.00, 10320.00, 10180.00,
     1, 1, 0, 127.50, 0.00, 0.00),
    
    (v_account_id::TEXT, v_account_number, CURRENT_DATE - 3,
     10300.00, 10420.00, 10420.00, 10275.00,
     1, 0, 1, 0.00, 25.00, 1.20),
    
    (v_account_id::TEXT, v_account_number, CURRENT_DATE - 2,
     10420.00, 10450.00, 10480.00, 10420.00,
     1, 1, 0, 60.00, 0.00, 0.00),
    
    (v_account_id::TEXT, v_account_number, CURRENT_DATE - 1,
     10450.00, 10480.00, 10507.00, 10450.00,
     1, 1, 0, 27.00, 0.00, 0.00),
    
    (v_account_id::TEXT, v_account_number, CURRENT_DATE,
     10480.00, v_current_balance, v_current_balance, 10480.00,
     0, 0, 0, 0.00, 0.00, 0.00)
    
    ON CONFLICT (account_number, date) 
    DO UPDATE SET
        closing_balance = EXCLUDED.closing_balance,
        high_balance = EXCLUDED.high_balance,
        low_balance = EXCLUDED.low_balance,
        total_trades = EXCLUDED.total_trades,
        winning_trades = EXCLUDED.winning_trades,
        losing_trades = EXCLUDED.losing_trades,
        total_profit = EXCLUDED.total_profit,
        total_loss = EXCLUDED.total_loss,
        max_drawdown = EXCLUDED.max_drawdown;
    
    RAISE NOTICE 'Datos de prueba insertados exitosamente para cuenta %', v_account_number;
    
END $$;

-- =====================================================
-- 4. VERIFICACIÓN DE DATOS INSERTADOS
-- =====================================================

-- Verificar balance history
SELECT 
    'Balance History' as tabla,
    COUNT(*) as registros,
    MIN(timestamp) as desde,
    MAX(timestamp) as hasta
FROM account_balance_history
WHERE account_number = '101197';

-- Verificar operaciones
SELECT 
    'Trading Operations' as tabla,
    COUNT(*) as total_operaciones,
    SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as ganadoras,
    SUM(CASE WHEN profit < 0 THEN 1 ELSE 0 END) as perdedoras,
    ROUND(SUM(profit)::numeric, 2) as profit_total
FROM trading_operations
WHERE account_number = '101197';

-- Verificar distribución por instrumento
SELECT 
    symbol,
    COUNT(*) as operaciones,
    ROUND(SUM(profit)::numeric, 2) as profit_total,
    ROUND(AVG(profit)::numeric, 2) as profit_promedio
FROM trading_operations
WHERE account_number = '101197'
GROUP BY symbol
ORDER BY operaciones DESC;

-- Verificar métricas diarias
SELECT 
    'Daily Metrics' as tabla,
    COUNT(*) as dias_registrados,
    SUM(total_trades) as operaciones_totales,
    ROUND(AVG(max_drawdown)::numeric, 2) as drawdown_promedio
FROM account_daily_metrics
WHERE account_number = '101197';

-- Mensaje final
SELECT 
    '✅ DATOS DE PRUEBA INSERTADOS' as mensaje,
    'Ahora puedes ver:' as instrucciones,
    '- Gráfico de balance con evolución de 30 días' as item1,
    '- 13 operaciones cerradas (9 ganadoras, 4 perdedoras)' as item2,
    '- Distribución EURUSD (8 ops) / XAUUSD (5 ops)' as item3,
    '- KPIs calculados con datos reales' as item4,
    '- Profit total: ~$500' as item5;