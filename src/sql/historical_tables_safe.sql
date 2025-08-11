-- Script seguro que verifica si las tablas existen antes de crearlas
-- Y solo crea lo que falta

-- =====================================================
-- 1. CREAR TABLAS SI NO EXISTEN
-- =====================================================

-- Tabla para guardar snapshots históricos del balance de las cuentas
CREATE TABLE IF NOT EXISTS account_balance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id TEXT NOT NULL,
    account_number TEXT NOT NULL,
    balance DECIMAL(20, 2) NOT NULL,
    equity DECIMAL(20, 2) NOT NULL,
    margin DECIMAL(20, 2) DEFAULT 0,
    free_margin DECIMAL(20, 2) DEFAULT 0,
    profit_loss DECIMAL(20, 2) DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para guardar historial de operaciones
CREATE TABLE IF NOT EXISTS trading_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ticket BIGINT NOT NULL,
    symbol TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    volume DECIMAL(10, 4) NOT NULL,
    open_price DECIMAL(20, 8) NOT NULL,
    close_price DECIMAL(20, 8),
    open_time TIMESTAMPTZ NOT NULL,
    close_time TIMESTAMPTZ,
    stop_loss DECIMAL(20, 8),
    take_profit DECIMAL(20, 8),
    profit DECIMAL(20, 2),
    swap DECIMAL(20, 2) DEFAULT 0,
    commission DECIMAL(20, 2) DEFAULT 0,
    comment TEXT,
    status TEXT DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para métricas diarias agregadas
CREATE TABLE IF NOT EXISTS account_daily_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id TEXT NOT NULL,
    account_number TEXT NOT NULL,
    date DATE NOT NULL,
    opening_balance DECIMAL(20, 2) NOT NULL,
    closing_balance DECIMAL(20, 2) NOT NULL,
    high_balance DECIMAL(20, 2) NOT NULL,
    low_balance DECIMAL(20, 2) NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_profit DECIMAL(20, 2) DEFAULT 0,
    total_loss DECIMAL(20, 2) DEFAULT 0,
    max_drawdown DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_number, date)
);

-- =====================================================
-- 2. CREAR ÍNDICES SI NO EXISTEN
-- =====================================================

-- Índices para account_balance_history
CREATE INDEX IF NOT EXISTS idx_account_balance_account_id ON account_balance_history (account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_account_number ON account_balance_history (account_number);
CREATE INDEX IF NOT EXISTS idx_account_balance_timestamp ON account_balance_history (timestamp);

-- Índices para trading_operations
CREATE INDEX IF NOT EXISTS idx_operations_account_id ON trading_operations (account_id);
CREATE INDEX IF NOT EXISTS idx_operations_account_number ON trading_operations (account_number);
CREATE INDEX IF NOT EXISTS idx_operations_ticket ON trading_operations (ticket);
CREATE INDEX IF NOT EXISTS idx_operations_status ON trading_operations (status);
CREATE INDEX IF NOT EXISTS idx_operations_open_time ON trading_operations (open_time);

-- Índices para account_daily_metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_account_id ON account_daily_metrics (account_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_account_number ON account_daily_metrics (account_number);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON account_daily_metrics (date);

-- =====================================================
-- 3. HABILITAR RLS SI NO ESTÁ HABILITADO
-- =====================================================

-- Verificar y habilitar RLS
DO $$ 
BEGIN
    -- account_balance_history
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'account_balance_history' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- trading_operations
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'trading_operations' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE trading_operations ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- account_daily_metrics
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'account_daily_metrics' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE account_daily_metrics ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =====================================================
-- 4. CREAR POLÍTICAS RLS SI NO EXISTEN
-- =====================================================

-- Eliminar políticas existentes si las hay (para evitar duplicados)
DROP POLICY IF EXISTS "Users can view their own balance history" ON account_balance_history;
DROP POLICY IF EXISTS "System can insert balance history" ON account_balance_history;
DROP POLICY IF EXISTS "Users can view their own operations" ON trading_operations;
DROP POLICY IF EXISTS "System can manage operations" ON trading_operations;
DROP POLICY IF EXISTS "Users can view their own metrics" ON account_daily_metrics;
DROP POLICY IF EXISTS "System can manage metrics" ON account_daily_metrics;

-- Crear políticas nuevas
CREATE POLICY "Users can view their own balance history"
    ON account_balance_history
    FOR SELECT
    USING (
        account_id::UUID IN (
            SELECT id FROM trading_accounts 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert balance history"
    ON account_balance_history
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own operations"
    ON trading_operations
    FOR SELECT
    USING (
        account_id::UUID IN (
            SELECT id FROM trading_accounts 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage operations"
    ON trading_operations
    FOR ALL
    WITH CHECK (true);

CREATE POLICY "Users can view their own metrics"
    ON account_daily_metrics
    FOR SELECT
    USING (
        account_id::UUID IN (
            SELECT id FROM trading_accounts 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage metrics"
    ON account_daily_metrics
    FOR ALL
    WITH CHECK (true);

-- =====================================================
-- 5. CREAR FUNCIÓN PARA SNAPSHOT SI NO EXISTE
-- =====================================================

CREATE OR REPLACE FUNCTION record_balance_snapshot(
    p_account_id TEXT,
    p_account_number TEXT,
    p_balance DECIMAL,
    p_equity DECIMAL,
    p_margin DECIMAL DEFAULT 0,
    p_free_margin DECIMAL DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO account_balance_history (
        account_id,
        account_number,
        balance,
        equity,
        margin,
        free_margin,
        profit_loss,
        timestamp
    ) VALUES (
        p_account_id,
        p_account_number,
        p_balance,
        p_equity,
        p_margin,
        p_free_margin,
        p_equity - p_balance,
        NOW()
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. INSERTAR SNAPSHOTS INICIALES
-- =====================================================

-- Insertar snapshots iniciales solo para cuentas con balance que no tienen snapshots
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
    ta.id::TEXT as account_id,
    ta.account_number,
    COALESCE(ta.balance, 0) as balance,
    COALESCE(ta.equity, ta.balance, 0) as equity,
    COALESCE(ta.margin, 0) as margin,
    COALESCE(ta.free_margin, ta.balance, 0) as free_margin,
    0 as profit_loss,
    NOW() as timestamp
FROM trading_accounts ta
WHERE ta.balance > 0
  AND NOT EXISTS (
    SELECT 1 
    FROM account_balance_history abh 
    WHERE abh.account_number = ta.account_number
  );

-- =====================================================
-- 7. VERIFICAR QUE TODO SE CREÓ
-- =====================================================

-- Mostrar resumen
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