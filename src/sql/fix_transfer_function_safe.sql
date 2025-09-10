-- ============================================
-- ARREGLAR FUNCIÓN DE TRANSFERENCIAS DE FORMA SEGURA
-- Elimina la función existente y crea la nueva
-- ============================================

-- 1. VER LA FUNCIÓN EXISTENTE COMPLETA
SELECT 'Función existente antes del cambio:' as info;
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as parameters,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname = 'create_transfer_request';

-- 2. ELIMINAR LA FUNCIÓN EXISTENTE CON SUS PARÁMETROS EXACTOS
DROP FUNCTION IF EXISTS create_transfer_request(text,text,text,text,numeric);
DROP FUNCTION IF EXISTS create_transfer_request(text,text,text,text,decimal);

-- 3. CREAR LA NUEVA FUNCIÓN CON TIPOS CORRECTOS
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
    -- Obtener el usuario actual
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usuario no autenticado'
        );
    END IF;
    
    -- Validar cantidad
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Amount must be greater than zero'
        );
    END IF;
    
    -- Verificar balance según el origen de la transferencia
    IF p_from_account_id = 'general' THEN
        -- Transferencia desde balance general
        SELECT COALESCE(broker_balance, 0) INTO v_current_balance
        FROM profiles 
        WHERE id = v_user_id;
        
        IF v_current_balance < p_amount THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient balance in general wallet',
                'current_balance', v_current_balance,
                'requested_amount', p_amount
            );
        END IF;
        
    ELSE
        -- Transferencia desde cuenta broker
        SELECT COALESCE(balance, 0) INTO v_from_balance
        FROM broker_accounts 
        WHERE id = p_from_account_id::UUID 
        AND user_id = v_user_id;
        
        IF v_from_balance IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Source account not found or access denied'
            );
        END IF;
        
        IF v_from_balance < p_amount THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient balance in source account',
                'current_balance', v_from_balance,
                'requested_amount', p_amount
            );
        END IF;
    END IF;
    
    -- Verificar cuenta destino si no es 'general'
    IF p_to_account_id != 'general' THEN
        SELECT COUNT(*) INTO v_to_balance
        FROM broker_accounts 
        WHERE id = p_to_account_id::UUID 
        AND user_id = v_user_id;
        
        IF v_to_balance = 0 THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Destination account not found or access denied'
            );
        END IF;
    END IF;
    
    -- Insertar el registro de transferencia
    INSERT INTO internal_transfers (
        user_id, 
        from_account_id, 
        from_account_name,
        to_account_id, 
        to_account_name, 
        amount, 
        status,
        processed,
        processed_at,
        completed_at
    ) VALUES (
        v_user_id, 
        p_from_account_id, 
        p_from_account_name,
        p_to_account_id, 
        p_to_account_name, 
        p_amount, 
        'completed',
        true,
        NOW(),
        NOW()
    ) RETURNING id INTO v_transfer_id;
    
    -- Ejecutar las transferencias de balance
    IF p_from_account_id = 'general' AND p_to_account_id != 'general' THEN
        -- Balance General → Cuenta Broker
        UPDATE profiles 
        SET broker_balance = COALESCE(broker_balance, 0) - p_amount,
            broker_balance_updated_at = NOW()
        WHERE id = v_user_id;
        
        UPDATE broker_accounts
        SET balance = COALESCE(balance, 0) + p_amount,
            updated_at = NOW()
        WHERE id = p_to_account_id::UUID
        AND user_id = v_user_id;
        
    ELSIF p_from_account_id != 'general' AND p_to_account_id = 'general' THEN
        -- Cuenta Broker → Balance General
        UPDATE broker_accounts
        SET balance = COALESCE(balance, 0) - p_amount,
            updated_at = NOW()
        WHERE id = p_from_account_id::UUID
        AND user_id = v_user_id;
        
        UPDATE profiles 
        SET broker_balance = COALESCE(broker_balance, 0) + p_amount,
            broker_balance_updated_at = NOW()
        WHERE id = v_user_id;
        
    ELSIF p_from_account_id != 'general' AND p_to_account_id != 'general' THEN
        -- Cuenta Broker → Cuenta Broker
        UPDATE broker_accounts
        SET balance = COALESCE(balance, 0) - p_amount,
            updated_at = NOW()
        WHERE id = p_from_account_id::UUID
        AND user_id = v_user_id;
        
        UPDATE broker_accounts
        SET balance = COALESCE(balance, 0) + p_amount,
            updated_at = NOW()
        WHERE id = p_to_account_id::UUID
        AND user_id = v_user_id;
        
    ELSE
        -- Caso inválido: general → general
        DELETE FROM internal_transfers WHERE id = v_transfer_id;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid transfer: cannot transfer from general to general'
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
        IF v_transfer_id IS NOT NULL THEN
            DELETE FROM internal_transfers WHERE id = v_transfer_id;
        END IF;
        
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREAR FUNCIÓN AUXILIAR PARA OBTENER CUENTAS
CREATE OR REPLACE FUNCTION get_user_broker_accounts()
RETURNS TABLE(
    id UUID,
    account_name TEXT,
    account_number TEXT,
    balance DECIMAL,
    account_type TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ba.id,
        ba.account_name,
        ba.account_number,
        COALESCE(ba.balance, 0) as balance,
        ba.account_type,
        ba.status
    FROM broker_accounts ba
    WHERE ba.user_id = auth.uid()
    AND ba.status = 'active'
    ORDER BY ba.account_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CONFIGURAR RLS EN broker_accounts
ALTER TABLE broker_accounts ENABLE ROW LEVEL SECURITY;

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

-- 6. VERIFICAR QUE LA FUNCIÓN SE CREÓ CORRECTAMENTE
SELECT 'Nueva función creada exitosamente:' as info;
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as parameters,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname = 'create_transfer_request';

SELECT 'Función de transferencias actualizada exitosamente' AS resultado;