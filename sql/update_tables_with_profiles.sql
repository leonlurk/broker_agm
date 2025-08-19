-- SQL CORRECTO usando la tabla profiles existente
-- Este script actualiza las tablas de transacciones para trabajar con el sistema de aprobación CRM

-- =========================================
-- 1. ACTUALIZAR TABLA deposits
-- =========================================

-- Agregar user_id como UUID (referencia a profiles.id)
ALTER TABLE deposits 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

-- Llenar user_id basándose en el email
UPDATE deposits d
SET user_id = p.id
FROM profiles p
WHERE d.email = p.email
AND d.user_id IS NULL;

-- Agregar columnas adicionales necesarias
ALTER TABLE deposits
ADD COLUMN IF NOT EXISTS account_id TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS payment_method_id UUID,
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS network TEXT,
ADD COLUMN IF NOT EXISTS admin_id UUID,
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Actualizar constraint de status si es necesario
DO $$ 
BEGIN
    ALTER TABLE deposits DROP CONSTRAINT IF EXISTS deposits_status_check;
    ALTER TABLE deposits ADD CONSTRAINT deposits_status_check 
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'processing', 'completed', 'cancelled'));
EXCEPTION
    WHEN others THEN
        NULL;
END $$;

-- =========================================
-- 2. ACTUALIZAR TABLA withdrawals
-- =========================================

-- Asegurar que user_id es UUID y referencia a profiles
DO $$ 
BEGIN
    -- Si user_id es TEXT, convertirlo a UUID
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'withdrawals' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS user_id_temp UUID;
        
        UPDATE withdrawals 
        SET user_id_temp = user_id::UUID 
        WHERE user_id IS NOT NULL 
        AND user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        ALTER TABLE withdrawals DROP COLUMN user_id;
        ALTER TABLE withdrawals RENAME COLUMN user_id_temp TO user_id;
    END IF;
    
    -- Agregar referencia a profiles si no existe
    ALTER TABLE withdrawals 
    ADD CONSTRAINT withdrawals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id);
EXCEPTION
    WHEN foreign_key_violation THEN
        NULL; -- La constraint ya existe
END $$;

-- Agregar columnas adicionales
ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS account_id TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS payment_method_id UUID,
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS payment_method_details JSONB,
ADD COLUMN IF NOT EXISTS tx_hash TEXT,
ADD COLUMN IF NOT EXISTS fee DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS kyc_status TEXT,
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_id UUID,
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Actualizar constraint de status
DO $$ 
BEGIN
    ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;
    ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_status_check 
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'processing', 'completed', 'cancelled'));
EXCEPTION
    WHEN others THEN
        NULL;
END $$;

-- =========================================
-- 3. ACTUALIZAR TABLA transactions
-- =========================================

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS fee DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS payment_method_id UUID,
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS kyc_status TEXT,
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_id UUID,
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Actualizar constraint de status
DO $$ 
BEGIN
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
    ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'processing', 'completed', 'cancelled'));
EXCEPTION
    WHEN others THEN
        NULL;
END $$;

-- =========================================
-- 4. CREAR TABLA DE HISTORIAL DE ESTADOS
-- =========================================

CREATE TABLE IF NOT EXISTS transaction_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    transaction_id UUID NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_transaction ON transaction_status_history(table_name, transaction_id);

-- =========================================
-- 5. CREAR TABLA DE BALANCES
-- =========================================

CREATE TABLE IF NOT EXISTS account_balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id),
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
-- 6. CREAR TABLA DE LÍMITES DE RETIRO
-- =========================================

CREATE TABLE IF NOT EXISTS withdrawal_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES profiles(id),
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
            NEW.admin_id,
            NEW.rejection_reason
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
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
-- 8. HABILITAR RLS
-- =========================================

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
    FOR SELECT USING (
        auth.uid() = user_id 
        OR auth.email() = email
    );

DROP POLICY IF EXISTS "Users can create deposits" ON deposits;
CREATE POLICY "Users can create deposits" ON deposits
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR auth.email() = email
    );

-- Políticas para withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create withdrawals" ON withdrawals;
CREATE POLICY "Users can create withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel pending withdrawals" ON withdrawals;
CREATE POLICY "Users can cancel pending withdrawals" ON withdrawals
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (status = 'cancelled');

-- Políticas para transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para balances y límites
DROP POLICY IF EXISTS "Users can view own balances" ON account_balances;
CREATE POLICY "Users can view own balances" ON account_balances
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own limits" ON withdrawal_limits;
CREATE POLICY "Users can view own limits" ON withdrawal_limits
    FOR SELECT USING (auth.uid() = user_id);

-- Service role acceso completo
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

-- Vista de solicitudes pendientes usando profiles
CREATE OR REPLACE VIEW pending_requests_all AS
SELECT 
    'deposit' as request_type,
    d.id,
    COALESCE(d.user_id::TEXT, d.email) as user_identifier,
    d.amount,
    d.status,
    d.created_at,
    d.payment_method as payment_method_type,
    d.cryptocurrency as network,
    d.wallet_address,
    d.email as user_email,
    d.client_name as user_name,
    CASE 
        WHEN p.kyc_status = 'verified' OR p.kyc_status = 'approved' THEN true
        ELSE false
    END as kyc_verified,
    p.kyc_status,
    p.kyc_level
FROM deposits d
LEFT JOIN profiles p ON (d.user_id = p.id OR d.email = p.email)
WHERE d.status IN ('pending', 'reviewing')

UNION ALL

SELECT 
    'withdrawal' as request_type,
    w.id,
    w.user_id::TEXT as user_identifier,
    w.amount,
    w.status,
    w.requested_at as created_at,
    w.withdrawal_type as payment_method_type,
    w.crypto_network as network,
    w.crypto_address as wallet_address,
    p.email as user_email,
    COALESCE(p.full_name, p.nombre || ' ' || p.apellido, p.email) as user_name,
    CASE 
        WHEN p.kyc_status = 'verified' OR p.kyc_status = 'approved' THEN true
        ELSE false
    END as kyc_verified,
    p.kyc_status,
    p.kyc_level
FROM withdrawals w
LEFT JOIN profiles p ON w.user_id = p.id
WHERE w.status IN ('pending', 'reviewing')

UNION ALL

SELECT 
    'transfer' as request_type,
    t.id,
    t.user_id::TEXT as user_identifier,
    t.amount,
    t.status,
    t.created_at,
    t.method as payment_method_type,
    NULL as network,
    t.wallet_address,
    p.email as user_email,
    COALESCE(p.full_name, p.nombre || ' ' || p.apellido, p.email) as user_name,
    CASE 
        WHEN p.kyc_status = 'verified' OR p.kyc_status = 'approved' THEN true
        ELSE false
    END as kyc_verified,
    p.kyc_status,
    p.kyc_level
FROM transactions t
LEFT JOIN profiles p ON t.user_id = p.id
WHERE t.status IN ('pending', 'reviewing')
    AND t.type = 'transferir'
ORDER BY created_at DESC;

-- Vista de estadísticas por usuario
CREATE OR REPLACE VIEW user_transaction_stats AS
SELECT 
    user_identifier,
    SUM(CASE WHEN request_type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END) as total_deposits,
    SUM(CASE WHEN request_type = 'withdrawal' AND status = 'completed' THEN amount ELSE 0 END) as total_withdrawals,
    SUM(CASE WHEN request_type = 'transfer' AND status = 'completed' THEN amount ELSE 0 END) as total_transfers,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests
FROM (
    SELECT 'deposit' as request_type, COALESCE(user_id::TEXT, email) as user_identifier, amount, status FROM deposits
    UNION ALL
    SELECT 'withdrawal', user_id::TEXT, amount, status FROM withdrawals
    UNION ALL
    SELECT 'transfer', user_id::TEXT, amount, status FROM transactions WHERE type = 'transferir'
) all_transactions
GROUP BY user_identifier;

-- =========================================
-- 11. INSERTAR LÍMITES INICIALES
-- =========================================

INSERT INTO withdrawal_limits (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM withdrawal_limits WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- =========================================
-- 12. AGREGAR ÍNDICES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_email ON deposits(email);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requested_at ON withdrawals(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- =========================================
-- MENSAJE FINAL
-- =========================================
DO $$
BEGIN
    RAISE NOTICE 'Script completado. Las tablas han sido actualizadas para soportar el sistema de solicitudes con aprobación CRM usando la tabla profiles.';
END $$;