-- ============================================
-- TABLAS DE TRANSACCIONES PARA ALPHA GLOBAL MARKET
-- Depósitos, Retiros y Transferencias Internas
-- ============================================

-- 1. TABLA DE DEPÓSITOS
-- ============================================
CREATE TABLE IF NOT EXISTS deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    amount DECIMAL(20, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL, -- 'crypto', 'bank', 'card'
    
    -- Campos específicos para crypto
    crypto_currency TEXT, -- 'USDT', 'BTC', 'ETH'
    crypto_network TEXT, -- 'tron', 'ethereum', 'bsc'
    wallet_address TEXT,
    transaction_hash TEXT UNIQUE,
    
    -- Campos de verificación Payroll
    payroll_data JSONB, -- Datos completos de Payroll API
    payroll_verified BOOLEAN DEFAULT FALSE,
    payroll_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Procesamiento MT5
    mt5_processed BOOLEAN DEFAULT FALSE,
    mt5_processed_at TIMESTAMP WITH TIME ZONE,
    mt5_ticket TEXT,
    
    -- Estados y timestamps
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata adicional
    notes TEXT,
    admin_notes TEXT,
    ip_address INET,
    user_agent TEXT
);

-- Índices para deposits
CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_account_id ON deposits(account_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_transaction_hash ON deposits(transaction_hash);
CREATE INDEX idx_deposits_created_at ON deposits(created_at DESC);

-- 2. TABLA DE RETIROS
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    amount DECIMAL(20, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'USD',
    withdrawal_type TEXT NOT NULL, -- 'crypto', 'bank'
    
    -- Campos específicos para crypto
    crypto_currency TEXT,
    wallet_address TEXT,
    network TEXT, -- 'tron', 'ethereum'
    method_alias TEXT, -- Alias del método de pago guardado
    
    -- Campos para transferencia bancaria
    bank_name TEXT,
    bank_account TEXT,
    bank_details JSONB,
    
    -- Verificación 2FA
    two_fa_verified BOOLEAN DEFAULT FALSE,
    two_fa_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Procesamiento
    transaction_hash TEXT, -- Hash de la transacción blockchain cuando se procese
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Estados y timestamps
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    rejection_reason TEXT,
    notes TEXT,
    admin_notes TEXT,
    ip_address INET,
    user_agent TEXT
);

-- Índices para withdrawals
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_account_id ON withdrawals(account_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_requested_at ON withdrawals(requested_at DESC);

-- 3. TABLA DE TRANSFERENCIAS INTERNAS
-- ============================================
CREATE TABLE IF NOT EXISTS internal_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Cuenta origen
    from_account_id TEXT NOT NULL,
    from_account_name TEXT NOT NULL,
    
    -- Cuenta destino
    to_account_id TEXT NOT NULL,
    to_account_name TEXT NOT NULL,
    
    amount DECIMAL(20, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'USD',
    
    -- Procesamiento
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Estados y timestamps
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    notes TEXT,
    transfer_type TEXT DEFAULT 'internal', -- 'internal', 'mt5'
    reference_number TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT
);

-- Índices para internal_transfers
CREATE INDEX idx_transfers_user_id ON internal_transfers(user_id);
CREATE INDEX idx_transfers_from_account ON internal_transfers(from_account_id);
CREATE INDEX idx_transfers_to_account ON internal_transfers(to_account_id);
CREATE INDEX idx_transfers_status ON internal_transfers(status);
CREATE INDEX idx_transfers_created_at ON internal_transfers(created_at DESC);

-- 4. TABLA DE BALANCE DEL BROKER (en profiles)
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS broker_balance DECIMAL(20, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS broker_balance_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. FUNCIONES RPC PARA MANEJO DE TRANSACCIONES
-- ============================================

-- Función para crear solicitud de depósito
CREATE OR REPLACE FUNCTION create_deposit_request(
    p_account_id TEXT,
    p_account_name TEXT,
    p_amount DECIMAL,
    p_payment_method TEXT,
    p_crypto_currency TEXT DEFAULT NULL,
    p_crypto_network TEXT DEFAULT NULL,
    p_wallet_address TEXT DEFAULT NULL,
    p_transaction_hash TEXT DEFAULT NULL,
    p_payroll_data JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_deposit_id UUID;
BEGIN
    -- Obtener el user_id actual
    v_user_id := auth.uid();
    
    -- Insertar el depósito
    INSERT INTO deposits (
        user_id, account_id, account_name, amount, payment_method,
        crypto_currency, crypto_network, wallet_address, transaction_hash,
        payroll_data, payroll_verified, status
    ) VALUES (
        v_user_id, p_account_id, p_account_name, p_amount, p_payment_method,
        p_crypto_currency, p_crypto_network, p_wallet_address, p_transaction_hash,
        p_payroll_data, 
        CASE WHEN p_payroll_data IS NOT NULL THEN TRUE ELSE FALSE END,
        'pending'
    ) RETURNING id INTO v_deposit_id;
    
    -- Si es para balance general, actualizar broker_balance
    IF p_account_id = 'general' THEN
        UPDATE profiles 
        SET broker_balance = broker_balance + p_amount,
            broker_balance_updated_at = NOW()
        WHERE id = v_user_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'deposit_id', v_deposit_id,
        'message', 'Deposit request created successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear solicitud de retiro
CREATE OR REPLACE FUNCTION create_withdrawal_request(
    p_account_id TEXT,
    p_account_name TEXT,
    p_amount DECIMAL,
    p_withdrawal_type TEXT,
    p_crypto_currency TEXT DEFAULT NULL,
    p_wallet_address TEXT DEFAULT NULL,
    p_network TEXT DEFAULT NULL,
    p_bank_name TEXT DEFAULT NULL,
    p_bank_account TEXT DEFAULT NULL,
    p_bank_details JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_withdrawal_id UUID;
    v_current_balance DECIMAL;
BEGIN
    v_user_id := auth.uid();
    
    -- Verificar balance disponible si es desde balance general
    IF p_account_id = 'general' THEN
        SELECT broker_balance INTO v_current_balance
        FROM profiles WHERE id = v_user_id;
        
        IF v_current_balance < p_amount THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient balance'
            );
        END IF;
    END IF;
    
    -- Insertar la solicitud de retiro
    INSERT INTO withdrawals (
        user_id, account_id, account_name, amount, withdrawal_type,
        crypto_currency, wallet_address, network,
        bank_name, bank_account, bank_details,
        status
    ) VALUES (
        v_user_id, p_account_id, p_account_name, p_amount, p_withdrawal_type,
        p_crypto_currency, p_wallet_address, p_network,
        p_bank_name, p_bank_account, p_bank_details,
        'pending'
    ) RETURNING id INTO v_withdrawal_id;
    
    -- Actualizar balance (restar)
    IF p_account_id = 'general' THEN
        UPDATE profiles 
        SET broker_balance = broker_balance - p_amount,
            broker_balance_updated_at = NOW()
        WHERE id = v_user_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', v_withdrawal_id,
        'message', 'Withdrawal request created successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear transferencia interna
CREATE OR REPLACE FUNCTION create_transfer_request(
    p_from_account_id TEXT,
    p_from_account_name TEXT,
    p_to_account_id TEXT,
    p_to_account_name TEXT,
    p_amount DECIMAL
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_transfer_id UUID;
    v_current_balance DECIMAL;
BEGIN
    v_user_id := auth.uid();
    
    -- Verificar balance si es desde balance general
    IF p_from_account_id = 'general' THEN
        SELECT broker_balance INTO v_current_balance
        FROM profiles WHERE id = v_user_id;
        
        IF v_current_balance < p_amount THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient balance'
            );
        END IF;
    END IF;
    
    -- Insertar la transferencia
    INSERT INTO internal_transfers (
        user_id, from_account_id, from_account_name,
        to_account_id, to_account_name, amount, status
    ) VALUES (
        v_user_id, p_from_account_id, p_from_account_name,
        p_to_account_id, p_to_account_name, p_amount, 'pending'
    ) RETURNING id INTO v_transfer_id;
    
    -- Actualizar balance si es desde general
    IF p_from_account_id = 'general' THEN
        UPDATE profiles 
        SET broker_balance = broker_balance - p_amount,
            broker_balance_updated_at = NOW()
        WHERE id = v_user_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'transfer_id', v_transfer_id,
        'message', 'Transfer request created successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener transacciones del usuario
CREATE OR REPLACE FUNCTION get_user_transactions(
    p_type TEXT DEFAULT 'all',
    p_limit INT DEFAULT 50
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_deposits JSONB;
    v_withdrawals JSONB;
    v_transfers JSONB;
BEGIN
    v_user_id := auth.uid();
    
    -- Obtener depósitos
    IF p_type IN ('all', 'deposits') THEN
        SELECT jsonb_agg(row_to_json(d.*))
        INTO v_deposits
        FROM (
            SELECT * FROM deposits 
            WHERE user_id = v_user_id 
            ORDER BY created_at DESC 
            LIMIT p_limit
        ) d;
    END IF;
    
    -- Obtener retiros
    IF p_type IN ('all', 'withdrawals') THEN
        SELECT jsonb_agg(row_to_json(w.*))
        INTO v_withdrawals
        FROM (
            SELECT * FROM withdrawals 
            WHERE user_id = v_user_id 
            ORDER BY requested_at DESC 
            LIMIT p_limit
        ) w;
    END IF;
    
    -- Obtener transferencias
    IF p_type IN ('all', 'transfers') THEN
        SELECT jsonb_agg(row_to_json(t.*))
        INTO v_transfers
        FROM (
            SELECT * FROM internal_transfers 
            WHERE user_id = v_user_id 
            ORDER BY created_at DESC 
            LIMIT p_limit
        ) t;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'deposits', COALESCE(v_deposits, '[]'::jsonb),
        'withdrawals', COALESCE(v_withdrawals, '[]'::jsonb),
        'transfers', COALESCE(v_transfers, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_transfers ENABLE ROW LEVEL SECURITY;

-- Políticas para deposits
CREATE POLICY "Users can view own deposits" ON deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert deposits" ON deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para withdrawals
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para internal_transfers
CREATE POLICY "Users can view own transfers" ON internal_transfers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transfers" ON internal_transfers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON internal_transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. CONSULTAS DE VERIFICACIÓN
-- ============================================
-- Verificar que las tablas se crearon correctamente
SELECT 
    'deposits' as tabla,
    COUNT(*) as registros,
    CASE WHEN COUNT(*) >= 0 THEN '✅ Tabla creada' ELSE '❌ Error' END as estado
FROM deposits
UNION ALL
SELECT 
    'withdrawals' as tabla,
    COUNT(*) as registros,
    CASE WHEN COUNT(*) >= 0 THEN '✅ Tabla creada' ELSE '❌ Error' END as estado
FROM withdrawals
UNION ALL
SELECT 
    'internal_transfers' as tabla,
    COUNT(*) as registros,
    CASE WHEN COUNT(*) >= 0 THEN '✅ Tabla creada' ELSE '❌ Error' END as estado
FROM internal_transfers;