-- ============================================
-- CONFIGURAR TRANSFERENCIAS CON broker_accounts
-- Usando las tablas que SÍ existen
-- ============================================

-- 1. Ver estructura de broker_accounts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'broker_accounts'
ORDER BY ordinal_position;

-- 2. Ver cuentas del usuario actual en broker_accounts
SELECT 
    id,
    user_id,
    account_name,
    account_number,
    account_type,
    balance,
    status
FROM broker_accounts
WHERE user_id = auth.uid();

-- 3. Agregar columnas faltantes a profiles si no existen
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS broker_balance DECIMAL(20, 2) DEFAULT 0.00;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS broker_balance_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Ver función de transferencia existente
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'create_transfer_request'
LIMIT 1;

-- 5. Función actualizada para transferencias usando broker_accounts
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
        -- Si es desde cuenta broker, verificar balance de la cuenta
        SELECT balance INTO v_from_balance
        FROM broker_accounts 
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
        
        -- Sumar a la cuenta broker destino
        UPDATE broker_accounts
        SET balance = COALESCE(balance, 0) + p_amount,
            updated_at = NOW()
        WHERE id = p_to_account_id::UUID
        AND user_id = v_user_id;
        
    ELSIF p_to_account_id = 'general' THEN
        -- Transferencia desde broker a balance general
        -- Restar de la cuenta broker origen
        UPDATE broker_accounts
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
        -- Transferencia entre cuentas broker
        -- Restar de la cuenta origen
        UPDATE broker_accounts
        SET balance = balance - p_amount,
            updated_at = NOW()
        WHERE id = p_from_account_id::UUID
        AND user_id = v_user_id;
        
        -- Sumar a la cuenta destino
        UPDATE broker_accounts
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
    
    -- Registrar en broker_transactions si la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'broker_transactions') THEN
        INSERT INTO broker_transactions (
            user_id,
            account_id,
            transaction_type,
            amount,
            description,
            status
        ) VALUES (
            v_user_id,
            CASE 
                WHEN p_from_account_id = 'general' THEN NULL
                ELSE p_from_account_id::UUID
            END,
            'transfer',
            p_amount,
            'Transfer: ' || p_from_account_name || ' → ' || p_to_account_name,
            'completed'
        );
    END IF;
    
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

-- 6. Agregar columna updated_at a broker_accounts si no existe
ALTER TABLE broker_accounts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_broker_accounts_user_id 
ON broker_accounts(user_id);

-- 8. Habilitar RLS en broker_accounts
ALTER TABLE broker_accounts ENABLE ROW LEVEL SECURITY;

-- 9. Crear políticas RLS
DROP POLICY IF EXISTS "Users can view own broker accounts" ON broker_accounts;
DROP POLICY IF EXISTS "Users can update own broker accounts" ON broker_accounts;

CREATE POLICY "Users can view own broker accounts" 
ON broker_accounts
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own broker accounts" 
ON broker_accounts
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 10. Función auxiliar para obtener cuentas con balance
CREATE OR REPLACE FUNCTION get_broker_accounts_with_balance()
RETURNS TABLE(
    id UUID,
    account_name TEXT,
    account_number TEXT,
    balance DECIMAL,
    account_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ba.id,
        ba.account_name,
        ba.account_number,
        ba.balance,
        ba.account_type
    FROM broker_accounts ba
    WHERE ba.user_id = auth.uid()
    AND ba.balance > 0
    AND ba.status = 'active'
    ORDER BY ba.balance DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Vista para ver transferencias del usuario
CREATE OR REPLACE VIEW v_user_transfers AS
SELECT 
    it.id,
    it.from_account_id,
    it.from_account_name,
    it.to_account_id,
    it.to_account_name,
    it.amount,
    it.currency,
    it.status,
    it.created_at,
    it.completed_at,
    CASE 
        WHEN it.from_account_id = 'general' THEN 'Balance General → Broker'
        WHEN it.to_account_id = 'general' THEN 'Broker → Balance General'
        ELSE 'Broker → Broker'
    END as transfer_type
FROM internal_transfers it
WHERE it.user_id = auth.uid()
ORDER BY it.created_at DESC;

-- 12. Verificación final
SELECT 'Configuración completada para broker_accounts' AS status;