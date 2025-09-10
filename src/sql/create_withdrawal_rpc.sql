-- Crear o reemplazar la función RPC para solicitudes de retiro
-- Esta función maneja la creación de solicitudes de retiro

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
  
  -- Verificar el balance disponible
  SELECT broker_balance INTO v_broker_balance
  FROM broker_accounts
  WHERE user_id = v_user_id
  LIMIT 1;
  
  IF v_broker_balance IS NULL OR v_broker_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Balance insuficiente');
  END IF;
  
  -- Generar ID único para el retiro
  v_withdrawal_id := gen_random_uuid();
  
  -- Insertar la solicitud de retiro
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
    crypto_address,  -- Usar crypto_address en lugar de wallet_address
    crypto_network,   -- Usar crypto_network en lugar de network
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
    p_wallet_address,  -- Se mapea a crypto_address
    p_network,         -- Se mapea a crypto_network
    p_bank_name,
    p_bank_account,
    'pending',  -- Los retiros siempre empiezan como pending
    NOW(),
    NOW(),
    NOW()
  );
  
  -- NO actualizamos el balance aquí porque el retiro está pendiente
  -- El balance solo se actualiza cuando el admin aprueba el retiro
  
  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'data', jsonb_build_object(
      'id', v_withdrawal_id,
      'amount', p_amount,
      'status', 'pending',
      'message', 'Solicitud de retiro creada. Pendiente de aprobación.'
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

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION create_withdrawal_request TO authenticated;

-- Verificar que la función se creó correctamente
SELECT proname, pronargs, proargtypes 
FROM pg_proc 
WHERE proname = 'create_withdrawal_request';