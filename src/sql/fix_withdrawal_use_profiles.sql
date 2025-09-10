-- CORREGIR LA FUNCIÓN DE RETIROS PARA USAR profiles.broker_balance
-- NO elimina la función, la reemplaza con CREATE OR REPLACE

CREATE OR REPLACE FUNCTION create_withdrawal_request(
  p_account_id TEXT,
  p_account_name TEXT,
  p_amount NUMERIC,
  p_withdrawal_type VARCHAR,
  p_crypto_currency VARCHAR DEFAULT NULL,
  p_wallet_address TEXT DEFAULT NULL,
  p_network TEXT DEFAULT NULL,
  p_bank_name VARCHAR DEFAULT NULL,
  p_bank_account VARCHAR DEFAULT NULL,
  p_bank_details TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_withdrawal_id UUID;
  v_broker_balance NUMERIC;
BEGIN
  -- Obtener el user_id del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;
  
  -- CAMBIO IMPORTANTE: Obtener el balance de la tabla profiles, no broker_accounts
  SELECT broker_balance INTO v_broker_balance
  FROM profiles
  WHERE id = v_user_id;
  
  -- Verificar balance suficiente
  IF v_broker_balance IS NULL OR v_broker_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Balance insuficiente. Balance actual: ' || COALESCE(v_broker_balance, 0)
    );
  END IF;
  
  -- Generar ID único para el retiro
  v_withdrawal_id := gen_random_uuid();
  
  -- Insertar la solicitud de retiro
  -- Mapear los campos correctamente según la estructura de la tabla
  INSERT INTO withdrawals (
    id,
    user_id,
    withdrawal_id,
    account_id,
    account_name,
    amount,
    currency,
    withdrawal_type,
    crypto_currency,
    crypto_address,     -- La tabla usa crypto_address
    crypto_network,     -- La tabla usa crypto_network  
    bank_name,
    bank_account_number,
    status,
    requested_at,
    created_at,
    updated_at
  ) VALUES (
    v_withdrawal_id,
    v_user_id,
    'WD-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(v_withdrawal_id::text, 1, 8),
    p_account_id,
    p_account_name,
    p_amount,
    'USD',
    p_withdrawal_type,
    p_crypto_currency,
    p_wallet_address,   -- Se mapea p_wallet_address -> crypto_address
    p_network,          -- Se mapea p_network -> crypto_network
    p_bank_name,
    p_bank_account,
    'pending',          -- Siempre empieza como pending (requiere aprobación admin)
    NOW(),
    NOW(),
    NOW()
  );
  
  -- NO actualizamos el balance aquí
  -- El balance solo se actualiza cuando el admin aprueba el retiro
  
  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'data', jsonb_build_object(
      'id', v_withdrawal_id,
      'withdrawal_id', 'WD-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(v_withdrawal_id::text, 1, 8),
      'amount', p_amount,
      'status', 'pending',
      'balance_remaining', v_broker_balance,
      'message', 'Solicitud de retiro creada exitosamente. Pendiente de aprobación administrativa.'
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Error al procesar la solicitud: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurar permisos
GRANT EXECUTE ON FUNCTION create_withdrawal_request TO authenticated;

-- Verificar que la función se actualizó correctamente
SELECT 'Función actualizada. Ahora usa profiles.broker_balance' as resultado;