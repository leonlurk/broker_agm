-- SQL para actualizar las tablas existentes y agregar funcionalidad de solicitudes con aprobación CRM
-- Este script modifica las tablas existentes sin perder datos

-- =========================================
-- 1. ACTUALIZAR TABLA deposits (si existe)
-- =========================================

-- Agregar columnas necesarias a deposits si no existen
ALTER TABLE deposits 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id),
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS network TEXT,
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS tx_hash TEXT,
ADD COLUMN IF NOT EXISTS confirmations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_id TEXT,
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- =========================================
-- 2. ACTUALIZAR TABLA withdrawals (si existe)
-- =========================================

-- Agregar columnas necesarias a withdrawals si no existen
ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS account_id TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id),
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS payment_method_details JSONB,
ADD COLUMN IF NOT EXISTS network TEXT,
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS tx_hash TEXT,
ADD COLUMN IF NOT EXISTS fee DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS kyc_status TEXT,
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_id TEXT,
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- =========================================
-- 3. ACTUALIZAR TABLA transactions (para transferencias)
-- =========================================

-- La tabla transactions ya existe según el archivo 001_create_tables.sql
-- Vamos a agregar las columnas que faltan para el flujo de aprobación

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS fee DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id),
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS kyc_status TEXT,
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_id TEXT,
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Actualizar el check constraint del status si es necesario
DO $$ 
BEGIN
    -- Primero eliminar el constraint existente si existe
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
    -- Agregar el nuevo constraint
    ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'processing', 'completed', 'cancelled'));
EXCEPTION
    WHEN others THEN
        -- Si hay algún error, continuar
        NULL;
END $$;

-- =========================================
-- 4. CREAR TABLA DE HISTORIAL DE ESTADOS (si no existe)
-- =========================================

CREATE TABLE IF NOT EXISTS transaction_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL, -- 'deposits', 'withdrawals', 'transactions'
    transaction_id UUID NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_transaction ON transaction_status_history(table_name, transaction_id);

-- =========================================
-- 5. CREAR TABLA DE BALANCES (si no existe)
-- =========================================

CREATE TABLE IF NOT EXISTS account_balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    available_balance DECIMAL(15,2) DEFAULT 0,
    pending_withdrawals DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_account_balances_user_id ON account_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balances_account_id ON account_balances(account_id);

-- =========================================
-- 6. CREAR TABLA DE LÍMITES DE RETIRO (si no existe)
-- =========================================

CREATE TABLE IF NOT EXISTS withdrawal_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT UNIQUE,
    daily_limit DECIMAL(15,2) DEFAULT 5000,
    weekly_limit DECIMAL(15,2) DEFAULT 20000,
    monthly_limit DECIMAL(15,2) DEFAULT 50000,
    daily_used DECIMAL(15,2) DEFAULT 0,
    weekly_used DECIMAL(15,2) DEFAULT 0,
    monthly_used DECIMAL(15,2) DEFAULT 0,
    minimum_withdrawal DECIMAL(15,2) DEFAULT 50,
    last_reset_daily DATE,
    last_reset_weekly DATE,
    last_reset_monthly DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 7. CREAR FUNCIONES Y TRIGGERS
-- =========================================

-- Función para registrar cambios de estado
CREATE OR REPLACE FUNCTION log_transaction_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO transaction_status_history (
            table_name,
            transaction_id,
            old_status,
            new_status,
            changed_by,
            change_reason
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.admin_id, 'system'),
            NEW.rejection_reason
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a las tablas
DROP TRIGGER IF EXISTS log_deposits_status ON deposits;
CREATE TRIGGER log_deposits_status
    AFTER UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION log_transaction_status_change();

DROP TRIGGER IF EXISTS log_withdrawals_status ON withdrawals;
CREATE TRIGGER log_withdrawals_status
    AFTER UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION log_transaction_status_change();

DROP TRIGGER IF EXISTS log_transactions_status ON transactions;
CREATE TRIGGER log_transactions_status
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION log_transaction_status_change();

-- =========================================
-- 8. HABILITAR RLS (Row Level Security)
-- =========================================

-- Habilitar RLS en las tablas
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_status_history ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 9. CREAR POLÍTICAS RLS
-- =========================================

-- Políticas para deposits
DROP POLICY IF EXISTS "Users can view own deposits" ON deposits;
CREATE POLICY "Users can view own deposits" ON deposits
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can create deposits" ON deposits;
CREATE POLICY "Users can create deposits" ON deposits
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Políticas para withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can create withdrawals" ON withdrawals;
CREATE POLICY "Users can create withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can cancel pending withdrawals" ON withdrawals;
CREATE POLICY "Users can cancel pending withdrawals" ON withdrawals
    FOR UPDATE USING (auth.uid()::text = user_id AND status = 'pending')
    WITH CHECK (status = 'cancelled');

-- Políticas para transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas para account_balances
DROP POLICY IF EXISTS "Users can view own balances" ON account_balances;
CREATE POLICY "Users can view own balances" ON account_balances
    FOR SELECT USING (auth.uid()::text = user_id);

-- Políticas para withdrawal_limits
DROP POLICY IF EXISTS "Users can view own limits" ON withdrawal_limits;
CREATE POLICY "Users can view own limits" ON withdrawal_limits
    FOR SELECT USING (auth.uid()::text = user_id);

-- Service role tiene acceso completo (para admin CRM)
DROP POLICY IF EXISTS "Service role full access deposits" ON deposits;
CREATE POLICY "Service role full access deposits" ON deposits
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access withdrawals" ON withdrawals;
CREATE POLICY "Service role full access withdrawals" ON withdrawals
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access transactions" ON transactions;
CREATE POLICY "Service role full access transactions" ON transactions
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access balances" ON account_balances;
CREATE POLICY "Service role full access balances" ON account_balances
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access limits" ON withdrawal_limits;
CREATE POLICY "Service role full access limits" ON withdrawal_limits
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access history" ON transaction_status_history;
CREATE POLICY "Service role full access history" ON transaction_status_history
    FOR ALL USING (auth.role() = 'service_role');

-- =========================================
-- 10. CREAR VISTAS PARA EL CRM
-- =========================================

-- Vista unificada de todas las solicitudes pendientes
CREATE OR REPLACE VIEW pending_requests_all AS
SELECT 
    'deposit' as request_type,
    d.id,
    d.user_id,
    d.amount,
    d.status,
    d.created_at,
    d.payment_method_type,
    d.network,
    d.wallet_address,
    u.email as user_email,
    u.full_name as user_name,
    u.kyc_verified
FROM deposits d
LEFT JOIN users u ON d.user_id = u.id
WHERE d.status IN ('pending', 'reviewing')

UNION ALL

SELECT 
    'withdrawal' as request_type,
    w.id,
    w.user_id,
    w.amount,
    w.status,
    w.created_at,
    w.payment_method_type,
    w.network,
    w.wallet_address,
    u.email as user_email,
    u.full_name as user_name,
    u.kyc_verified
FROM withdrawals w
LEFT JOIN users u ON w.user_id = u.id
WHERE w.status IN ('pending', 'reviewing')

UNION ALL

SELECT 
    'transfer' as request_type,
    t.id,
    t.user_id::text,
    t.amount,
    t.status,
    t.created_at,
    t.method as payment_method_type,
    NULL as network,
    t.wallet_address,
    u.email as user_email,
    u.full_name as user_name,
    u.kyc_verified
FROM transactions t
LEFT JOIN users u ON t.user_id::text = u.id
WHERE t.status IN ('pending', 'reviewing')
    AND t.type = 'transferir'
ORDER BY created_at DESC;

-- Vista de estadísticas por usuario
CREATE OR REPLACE VIEW user_transaction_stats AS
SELECT 
    user_id,
    SUM(CASE WHEN request_type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END) as total_deposits,
    SUM(CASE WHEN request_type = 'withdrawal' AND status = 'completed' THEN amount ELSE 0 END) as total_withdrawals,
    SUM(CASE WHEN request_type = 'transfer' AND status = 'completed' THEN amount ELSE 0 END) as total_transfers,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests
FROM (
    SELECT 'deposit' as request_type, user_id, amount, status FROM deposits
    UNION ALL
    SELECT 'withdrawal', user_id, amount, status FROM withdrawals
    UNION ALL
    SELECT 'transfer', user_id::text, amount, status FROM transactions WHERE type = 'transferir'
) all_transactions
GROUP BY user_id;

-- =========================================
-- 11. INSERTAR LÍMITES INICIALES
-- =========================================

-- Insertar límites de retiro por defecto para usuarios existentes
INSERT INTO withdrawal_limits (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM withdrawal_limits)
ON CONFLICT (user_id) DO NOTHING;

-- =========================================
-- 12. AGREGAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- =========================================

-- Índices para deposits
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at DESC);

-- Índices para withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- Índices para transactions (si no existen)
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);