-- ============================================
-- AGREGAR FUNCIONALIDADES FALTANTES
-- Sin modificar la función existente
-- ============================================

-- 1. Agregar columna balance a trading_accounts si no existe
ALTER TABLE trading_accounts 
ADD COLUMN IF NOT EXISTS balance DECIMAL(20, 2) DEFAULT 0.00;

-- 2. Agregar columna updated_at si no existe
ALTER TABLE trading_accounts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Crear índice para optimizar búsquedas si no existe
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id 
ON trading_accounts(user_id);

-- 4. Habilitar RLS si no está habilitado
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas antiguas si existen y crear nuevas
DROP POLICY IF EXISTS "Users can view own trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can update own trading accounts balance" ON trading_accounts;

CREATE POLICY "Users can view own trading accounts" 
ON trading_accounts
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own trading accounts balance" 
ON trading_accounts
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Función auxiliar para actualizar balance de cuenta MT5
-- Esta función complementa la existente sin modificarla
CREATE OR REPLACE FUNCTION update_mt5_account_balance(
    p_account_id UUID,
    p_new_balance DECIMAL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE trading_accounts
    SET balance = p_new_balance,
        updated_at = NOW()
    WHERE id = p_account_id
    AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para transferir entre cuentas MT5
-- Esta es una función complementaria que usa la existente
CREATE OR REPLACE FUNCTION transfer_between_mt5_accounts(
    p_from_account_id UUID,
    p_to_account_id UUID,
    p_amount DECIMAL
) RETURNS JSONB AS $$
DECLARE
    v_from_balance DECIMAL;
    v_to_balance DECIMAL;
    v_user_id UUID;
    v_from_name TEXT;
    v_to_name TEXT;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    
    -- Obtener balances y nombres actuales
    SELECT balance, account_name INTO v_from_balance, v_from_name
    FROM trading_accounts 
    WHERE id = p_from_account_id AND user_id = v_user_id;
    
    SELECT balance, account_name INTO v_to_balance, v_to_name
    FROM trading_accounts 
    WHERE id = p_to_account_id AND user_id = v_user_id;
    
    -- Verificar balance suficiente
    IF v_from_balance IS NULL OR v_from_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient balance in source account'
        );
    END IF;
    
    -- Actualizar balances
    UPDATE trading_accounts
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = p_from_account_id AND user_id = v_user_id;
    
    UPDATE trading_accounts
    SET balance = COALESCE(balance, 0) + p_amount,
        updated_at = NOW()
    WHERE id = p_to_account_id AND user_id = v_user_id;
    
    -- Llamar a la función existente para registrar la transferencia
    v_result := create_transfer_request(
        p_from_account_id::TEXT,
        v_from_name,
        p_to_account_id::TEXT,
        v_to_name,
        p_amount
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Vista para ver transferencias con detalles
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
        WHEN it.from_account_id = 'general' THEN 'Balance General → MT5'
        WHEN it.to_account_id = 'general' THEN 'MT5 → Balance General'
        ELSE 'MT5 → MT5'
    END as transfer_type
FROM internal_transfers it
WHERE it.user_id = auth.uid()
ORDER BY it.created_at DESC;

-- 9. Función para obtener cuentas con balance
CREATE OR REPLACE FUNCTION get_accounts_with_balance()
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
        ta.id,
        ta.account_name,
        ta.account_number,
        ta.balance,
        ta.account_type
    FROM trading_accounts ta
    WHERE ta.user_id = auth.uid()
    AND ta.balance > 0
    AND ta.status = 'active'
    ORDER BY ta.balance DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_trading_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trading_accounts_updated_at_trigger ON trading_accounts;

CREATE TRIGGER update_trading_accounts_updated_at_trigger
BEFORE UPDATE ON trading_accounts
FOR EACH ROW
EXECUTE FUNCTION update_trading_accounts_updated_at();

-- Verificación final
SELECT 'Configuración completada. Funciones auxiliares creadas.' AS status;