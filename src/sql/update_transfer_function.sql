-- ============================================
-- ACTUALIZACIÓN DE FUNCIÓN RPC PARA TRANSFERENCIAS
-- Maneja transferencias entre Balance General y MT5
-- Y entre cuentas MT5
-- ============================================

-- Función mejorada para crear transferencia interna
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
    v_from_balance DECIMAL;
    v_to_balance DECIMAL;
BEGIN
    v_user_id := auth.uid();
    
    -- Verificar balance según el origen
    IF p_from_account_id = 'general' THEN
        -- Si es desde balance general, verificar broker_balance
        SELECT broker_balance INTO v_current_balance
        FROM profiles WHERE id = v_user_id;
        
        IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient balance in general wallet'
            );
        END IF;
    ELSE
        -- Si es desde cuenta MT5, verificar balance de la cuenta
        SELECT balance INTO v_from_balance
        FROM trading_accounts 
        WHERE id = p_from_account_id::UUID 
        AND user_id = v_user_id;
        
        IF v_from_balance IS NULL OR v_from_balance < p_amount THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient balance in source account'
            );
        END IF;
    END IF;
    
    -- Insertar la transferencia
    INSERT INTO internal_transfers (
        user_id, from_account_id, from_account_name,
        to_account_id, to_account_name, amount, status
    ) VALUES (
        v_user_id, p_from_account_id, p_from_account_name,
        p_to_account_id, p_to_account_name, p_amount, 'completed'
    ) RETURNING id INTO v_transfer_id;
    
    -- Actualizar balances según el tipo de transferencia
    IF p_from_account_id = 'general' THEN
        -- Restar del balance general
        UPDATE profiles 
        SET broker_balance = broker_balance - p_amount,
            broker_balance_updated_at = NOW()
        WHERE id = v_user_id;
        
        -- Sumar a la cuenta MT5 destino
        UPDATE trading_accounts
        SET balance = COALESCE(balance, 0) + p_amount,
            updated_at = NOW()
        WHERE id = p_to_account_id::UUID
        AND user_id = v_user_id;
        
    ELSIF p_to_account_id = 'general' THEN
        -- Transferencia desde MT5 a balance general
        -- Restar de la cuenta MT5 origen
        UPDATE trading_accounts
        SET balance = balance - p_amount,
            updated_at = NOW()
        WHERE id = p_from_account_id::UUID
        AND user_id = v_user_id;
        
        -- Sumar al balance general
        UPDATE profiles 
        SET broker_balance = COALESCE(broker_balance, 0) + p_amount,
            broker_balance_updated_at = NOW()
        WHERE id = v_user_id;
        
    ELSE
        -- Transferencia entre cuentas MT5
        -- Restar de la cuenta origen
        UPDATE trading_accounts
        SET balance = balance - p_amount,
            updated_at = NOW()
        WHERE id = p_from_account_id::UUID
        AND user_id = v_user_id;
        
        -- Sumar a la cuenta destino
        UPDATE trading_accounts
        SET balance = COALESCE(balance, 0) + p_amount,
            updated_at = NOW()
        WHERE id = p_to_account_id::UUID
        AND user_id = v_user_id;
    END IF;
    
    -- Marcar la transferencia como completada
    UPDATE internal_transfers
    SET completed_at = NOW(),
        processed = true,
        processed_at = NOW()
    WHERE id = v_transfer_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'transfer_id', v_transfer_id,
        'message', 'Transfer completed successfully',
        'from_account', p_from_account_name,
        'to_account', p_to_account_name,
        'amount', p_amount
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Si hay error, hacer rollback de la transferencia
        DELETE FROM internal_transfers WHERE id = v_transfer_id;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON FUNCTION create_transfer_request IS 'Procesa transferencias entre balance general y cuentas MT5, o entre cuentas MT5';

-- Verificar que las tablas tengan los campos necesarios
-- Si no existe la columna balance en trading_accounts, agregarla
ALTER TABLE trading_accounts 
ADD COLUMN IF NOT EXISTS balance DECIMAL(20, 2) DEFAULT 0.00;

-- Índice para optimizar búsquedas por user_id
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id 
ON trading_accounts(user_id);

-- Política RLS para trading_accounts
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own trading accounts" 
ON trading_accounts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own trading accounts balance" 
ON trading_accounts
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);