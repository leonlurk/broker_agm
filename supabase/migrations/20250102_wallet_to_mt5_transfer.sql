-- Función RPC mejorada para manejar transferencias desde balance general a cuentas MT5
-- Esta función maneja transferencias desde el wallet principal (broker_balance) hacia cuentas MT5

CREATE OR REPLACE FUNCTION create_transfer_request(
  p_from_account_id TEXT,
  p_from_account_name TEXT,
  p_to_account_id TEXT,
  p_to_account_name TEXT,
  p_amount DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_transfer_id UUID;
  v_current_broker_balance DECIMAL;
  v_current_mt5_balance DECIMAL;
  v_result JSON;
BEGIN
  -- Obtener el ID del usuario actual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no autenticado'
    );
  END IF;

  -- Verificar si es una transferencia desde el balance general
  IF p_from_account_id = 'general' THEN
    -- Obtener el balance actual del broker
    SELECT broker_balance INTO v_current_broker_balance
    FROM profiles
    WHERE id = v_user_id;
    
    -- Verificar fondos suficientes
    IF v_current_broker_balance IS NULL OR v_current_broker_balance < p_amount THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Saldo insuficiente en Wallet Principal'
      );
    END IF;
    
    -- Verificar que la cuenta MT5 destino existe y pertenece al usuario
    IF NOT EXISTS (
      SELECT 1 FROM broker_accounts 
      WHERE id = p_to_account_id::UUID 
      AND user_id = v_user_id
      AND status = 'active'
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cuenta MT5 destino no válida'
      );
    END IF;
    
    -- Iniciar transacción
    BEGIN
      -- Actualizar balance del broker (restar)
      UPDATE profiles
      SET broker_balance = broker_balance - p_amount,
          updated_at = NOW()
      WHERE id = v_user_id;
      
      -- Actualizar balance de la cuenta MT5 (sumar)
      UPDATE broker_accounts
      SET balance = COALESCE(balance, 0) + p_amount,
          updated_at = NOW()
      WHERE id = p_to_account_id::UUID;
      
      -- Crear registro de transferencia
      INSERT INTO internal_transfers (
        id,
        user_id,
        from_account_id,
        from_account_name,
        to_account_id,
        to_account_name,
        amount,
        currency,
        status,
        requested_at,
        processed_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        'general',
        p_from_account_name,
        p_to_account_id,
        p_to_account_name,
        p_amount,
        'USD',
        'completed',
        NOW(),
        NOW()
      ) RETURNING id INTO v_transfer_id;
      
      -- Crear notificación para el usuario
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        created_at
      ) VALUES (
        v_user_id,
        'transfer_completed',
        'Transferencia Completada',
        format('Transferencia de $%s desde Wallet Principal a %s completada', p_amount::TEXT, p_to_account_name),
        json_build_object(
          'transfer_id', v_transfer_id,
          'amount', p_amount,
          'from', p_from_account_name,
          'to', p_to_account_name
        ),
        NOW()
      );
      
      -- Commit implícito al final del bloque
      
      RETURN json_build_object(
        'success', true,
        'transfer_id', v_transfer_id,
        'data', json_build_object(
          'transfer_id', v_transfer_id,
          'amount', p_amount,
          'from', p_from_account_name,
          'to', p_to_account_name,
          'status', 'completed'
        )
      );
      
    EXCEPTION WHEN OTHERS THEN
      -- Rollback implícito en caso de error
      RETURN json_build_object(
        'success', false,
        'error', 'Error al procesar la transferencia: ' || SQLERRM
      );
    END;
    
  ELSE
    -- Transferencia entre cuentas MT5 (lógica existente)
    -- Verificar que ambas cuentas existen y pertenecen al usuario
    IF NOT EXISTS (
      SELECT 1 FROM broker_accounts 
      WHERE id = p_from_account_id::UUID 
      AND user_id = v_user_id
      AND status = 'active'
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cuenta origen no válida'
      );
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM broker_accounts 
      WHERE id = p_to_account_id::UUID 
      AND user_id = v_user_id
      AND status = 'active'
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cuenta destino no válida'
      );
    END IF;
    
    -- Obtener balance de la cuenta origen
    SELECT balance INTO v_current_mt5_balance
    FROM broker_accounts
    WHERE id = p_from_account_id::UUID;
    
    -- Verificar fondos suficientes
    IF v_current_mt5_balance IS NULL OR v_current_mt5_balance < p_amount THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Saldo insuficiente en cuenta origen'
      );
    END IF;
    
    -- Procesar transferencia entre cuentas MT5
    BEGIN
      -- Actualizar balance cuenta origen (restar)
      UPDATE broker_accounts
      SET balance = balance - p_amount,
          updated_at = NOW()
      WHERE id = p_from_account_id::UUID;
      
      -- Actualizar balance cuenta destino (sumar)
      UPDATE broker_accounts
      SET balance = COALESCE(balance, 0) + p_amount,
          updated_at = NOW()
      WHERE id = p_to_account_id::UUID;
      
      -- Crear registro de transferencia
      INSERT INTO internal_transfers (
        id,
        user_id,
        from_account_id,
        from_account_name,
        to_account_id,
        to_account_name,
        amount,
        currency,
        status,
        requested_at,
        processed_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        p_from_account_id,
        p_from_account_name,
        p_to_account_id,
        p_to_account_name,
        p_amount,
        'USD',
        'completed',
        NOW(),
        NOW()
      ) RETURNING id INTO v_transfer_id;
      
      RETURN json_build_object(
        'success', true,
        'transfer_id', v_transfer_id,
        'data', json_build_object(
          'transfer_id', v_transfer_id,
          'amount', p_amount,
          'from', p_from_account_name,
          'to', p_to_account_name,
          'status', 'completed'
        )
      );
      
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Error al procesar la transferencia: ' || SQLERRM
      );
    END;
  END IF;
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION create_transfer_request IS 'Maneja transferencias desde Wallet Principal (broker_balance) a cuentas MT5, o entre cuentas MT5';