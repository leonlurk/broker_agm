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

-- Crear índices para account_balance_history
CREATE INDEX idx_account_balance_account_id ON account_balance_history (account_id);
CREATE INDEX idx_account_balance_account_number ON account_balance_history (account_number);
CREATE INDEX idx_account_balance_timestamp ON account_balance_history (timestamp);

-- Tabla para guardar historial de operaciones
CREATE TABLE IF NOT EXISTS trading_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ticket BIGINT NOT NULL,
    symbol TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- 'BUY' o 'SELL'
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
    status TEXT DEFAULT 'OPEN', -- 'OPEN' o 'CLOSED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para trading_operations
CREATE INDEX idx_operations_account_id ON trading_operations (account_id);
CREATE INDEX idx_operations_account_number ON trading_operations (account_number);
CREATE INDEX idx_operations_ticket ON trading_operations (ticket);
CREATE INDEX idx_operations_status ON trading_operations (status);
CREATE INDEX idx_operations_open_time ON trading_operations (open_time);

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
    
    -- Único por cuenta y fecha
    UNIQUE(account_number, date)
);

-- Crear índices para account_daily_metrics
CREATE INDEX idx_daily_metrics_account_id ON account_daily_metrics (account_id);
CREATE INDEX idx_daily_metrics_account_number ON account_daily_metrics (account_number);
CREATE INDEX idx_daily_metrics_date ON account_daily_metrics (date);

-- RLS Policies
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para account_balance_history
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

-- Políticas para trading_operations
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

-- Políticas para account_daily_metrics
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

-- Función para registrar snapshot de balance
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