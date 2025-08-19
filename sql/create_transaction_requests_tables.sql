-- SQL para crear las tablas necesarias para el sistema de solicitudes de transacciones
-- Incluye depósitos, retiros y transferencias con aprobación por CRM

-- =========================================
-- 1. TABLA DE SOLICITUDES DE TRANSACCIONES
-- =========================================
CREATE TABLE IF NOT EXISTS transaction_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    
    -- Tipo de transacción
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer')),
    
    -- Estado de la solicitud
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
    
    -- Información de la cuenta de trading
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT, -- real, demo, etc.
    
    -- Montos
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    fee DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2), -- amount - fee
    
    -- Método de pago (para retiros y depósitos)
    payment_method_id UUID REFERENCES payment_methods(id),
    payment_method_type TEXT, -- crypto, bank, etc.
    payment_method_details JSONB, -- Detalles adicionales del método
    
    -- Para transferencias entre cuentas
    destination_account_id TEXT,
    destination_account_name TEXT,
    
    -- Información de transacción blockchain (para crypto)
    network TEXT, -- tron_trc20, ethereum_erc20, bitcoin, etc.
    wallet_address TEXT, -- Dirección de destino para retiros
    tx_hash TEXT, -- Hash de la transacción
    confirmations INTEGER DEFAULT 0,
    
    -- Información KYC
    kyc_status TEXT,
    kyc_verified BOOLEAN DEFAULT FALSE,
    
    -- Información de procesamiento
    admin_id TEXT, -- ID del admin que procesó la solicitud
    admin_email TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata adicional
    ip_address INET,
    user_agent TEXT,
    metadata JSONB
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_transaction_requests_user_id ON transaction_requests(user_id);
CREATE INDEX idx_transaction_requests_status ON transaction_requests(status);
CREATE INDEX idx_transaction_requests_type ON transaction_requests(transaction_type);
CREATE INDEX idx_transaction_requests_created_at ON transaction_requests(created_at DESC);
CREATE INDEX idx_transaction_requests_account_id ON transaction_requests(account_id);

-- =========================================
-- 2. TABLA DE HISTORIAL DE ESTADOS
-- =========================================
CREATE TABLE IF NOT EXISTS transaction_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_request_id UUID NOT NULL REFERENCES transaction_requests(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT, -- user_id o admin_id
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_status_history_request_id ON transaction_status_history(transaction_request_id);

-- =========================================
-- 3. TABLA DE BALANCES DE CUENTAS
-- =========================================
CREATE TABLE IF NOT EXISTS account_balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    available_balance DECIMAL(15,2) DEFAULT 0, -- Balance disponible (no en retiros pendientes)
    pending_withdrawals DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, account_id)
);

CREATE INDEX idx_account_balances_user_id ON account_balances(user_id);
CREATE INDEX idx_account_balances_account_id ON account_balances(account_id);

-- =========================================
-- 4. TABLA DE LÍMITES DE RETIRO
-- =========================================
CREATE TABLE IF NOT EXISTS withdrawal_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =========================================
-- 5. TABLA DE NOTIFICACIONES DE TRANSACCIONES
-- =========================================
CREATE TABLE IF NOT EXISTS transaction_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_request_id UUID REFERENCES transaction_requests(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL, -- email, sms, push
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    subject TEXT,
    content TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transaction_notifications_request_id ON transaction_notifications(transaction_request_id);
CREATE INDEX idx_transaction_notifications_user_id ON transaction_notifications(user_id);

-- =========================================
-- 6. RLS (Row Level Security) POLICIES
-- =========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE transaction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para transaction_requests
CREATE POLICY "Users can view own transaction requests" ON transaction_requests
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own transaction requests" ON transaction_requests
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can cancel own pending requests" ON transaction_requests
    FOR UPDATE USING (auth.uid()::text = user_id AND status = 'pending')
    WITH CHECK (status = 'cancelled');

-- Políticas para account_balances
CREATE POLICY "Users can view own balances" ON account_balances
    FOR SELECT USING (auth.uid()::text = user_id);

-- Políticas para withdrawal_limits
CREATE POLICY "Users can view own limits" ON withdrawal_limits
    FOR SELECT USING (auth.uid()::text = user_id);

-- Políticas para transaction_notifications
CREATE POLICY "Users can view own notifications" ON transaction_notifications
    FOR SELECT USING (auth.uid()::text = user_id);

-- Service role tiene acceso completo (para admin CRM)
CREATE POLICY "Service role full access requests" ON transaction_requests
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access history" ON transaction_status_history
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access balances" ON account_balances
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access limits" ON withdrawal_limits
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access notifications" ON transaction_notifications
    FOR ALL USING (auth.role() = 'service_role');

-- =========================================
-- 7. FUNCIONES Y TRIGGERS
-- =========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a transaction_requests
CREATE TRIGGER update_transaction_requests_updated_at 
    BEFORE UPDATE ON transaction_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger a account_balances
CREATE TRIGGER update_account_balances_updated_at 
    BEFORE UPDATE ON account_balances 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger a withdrawal_limits
CREATE TRIGGER update_withdrawal_limits_updated_at 
    BEFORE UPDATE ON withdrawal_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Función para registrar cambios de estado automáticamente
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO transaction_status_history (
            transaction_request_id,
            old_status,
            new_status,
            changed_by,
            change_reason
        ) VALUES (
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

-- Trigger para registrar cambios de estado
CREATE TRIGGER log_transaction_status_changes
    AFTER UPDATE ON transaction_requests
    FOR EACH ROW
    EXECUTE FUNCTION log_status_change();

-- =========================================
-- 8. VISTAS ÚTILES PARA EL CRM
-- =========================================

-- Vista de solicitudes pendientes
CREATE OR REPLACE VIEW pending_requests AS
SELECT 
    tr.*,
    u.email as user_email,
    u.full_name as user_name,
    u.kyc_verified,
    pm.alias as payment_method_alias,
    pm.method_type as payment_method_type
FROM transaction_requests tr
LEFT JOIN users u ON tr.user_id = u.id
LEFT JOIN payment_methods pm ON tr.payment_method_id = pm.id
WHERE tr.status IN ('pending', 'reviewing')
ORDER BY tr.created_at DESC;

-- Vista de estadísticas por usuario
CREATE OR REPLACE VIEW user_transaction_stats AS
SELECT 
    user_id,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
    SUM(CASE WHEN status = 'completed' AND transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
    SUM(CASE WHEN status = 'completed' AND transaction_type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawals,
    SUM(CASE WHEN status = 'completed' AND transaction_type = 'transfer' THEN amount ELSE 0 END) as total_transfers
FROM transaction_requests
GROUP BY user_id;

-- =========================================
-- 9. DATOS INICIALES
-- =========================================

-- Insertar límites de retiro por defecto para usuarios existentes
INSERT INTO withdrawal_limits (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- =========================================
-- 10. COMENTARIOS DE DOCUMENTACIÓN
-- =========================================

COMMENT ON TABLE transaction_requests IS 'Tabla principal para todas las solicitudes de transacciones (depósitos, retiros, transferencias)';
COMMENT ON TABLE transaction_status_history IS 'Historial de cambios de estado de las solicitudes';
COMMENT ON TABLE account_balances IS 'Balances de las cuentas de trading de los usuarios';
COMMENT ON TABLE withdrawal_limits IS 'Límites de retiro configurados por usuario';
COMMENT ON TABLE transaction_notifications IS 'Notificaciones enviadas relacionadas con las transacciones';

COMMENT ON COLUMN transaction_requests.status IS 'Estado de la solicitud: pending (inicial), reviewing (en revisión), approved (aprobada), rejected (rechazada), processing (procesando), completed (completada), cancelled (cancelada por usuario)';
COMMENT ON COLUMN transaction_requests.transaction_type IS 'Tipo de transacción: deposit (depósito), withdrawal (retiro), transfer (transferencia entre cuentas propias)';
COMMENT ON COLUMN transaction_requests.final_amount IS 'Monto final después de aplicar comisiones (amount - fee)';
COMMENT ON COLUMN account_balances.available_balance IS 'Balance disponible para operar (balance total - retiros pendientes)';