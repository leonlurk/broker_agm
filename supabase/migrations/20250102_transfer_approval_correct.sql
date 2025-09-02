-- =====================================================
-- FUNCIÓN ACTUALIZADA: Transferencias con aprobación admin
-- Usa los campos exactos de tu tabla internal_transfers
-- Fecha: 2025-01-02
-- =====================================================

-- Eliminar la función anterior si existe
DROP FUNCTION IF EXISTS create_transfer_request(text,text,text,text,numeric);

-- Crear función que crea transferencias en estado PENDING
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
  v_transfer_code TEXT;
  v_current_broker_balance DECIMAL;
  v_current_account_balance DECIMAL;
BEGIN
  -- Obtener el ID del usuario actual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no autenticado'
    );
  END IF;

  -- ========================================
  -- CASO 1: Transferencia desde Wallet Principal → MT5
  -- ========================================
  IF p_from_account_id = 'general' THEN
    
    -- Verificar el balance del wallet principal
    SELECT broker_balance INTO v_current_broker_balance
    FROM public.profiles
    WHERE id = v_user_id;
    
    -- Verificar fondos suficientes
    IF v_current_broker_balance IS NULL OR v_current_broker_balance < p_amount THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Saldo insuficiente en Wallet Principal',
        'current_balance', COALESCE(v_current_broker_balance, 0),
        'requested_amount', p_amount
      );
    END IF;
    
    -- Verificar que la cuenta MT5 destino existe
    IF NOT EXISTS (
      SELECT 1 FROM public.broker_accounts 
      WHERE id = p_to_account_id::UUID 
      AND user_id = v_user_id
      AND status IN ('active', 'Active', 'ACTIVE')
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cuenta MT5 destino no válida o inactiva'
      );
    END IF;
    
    BEGIN
      -- Crear registro de transferencia en estado PENDING
      -- El transfer_id se genera automáticamente con el default de la columna
      INSERT INTO public.internal_transfers (
        user_id,
        from_account_id,
        from_account_name,
        to_account_id,
        to_account_name,
        amount,
        currency,
        status,
        requested_at,
        admin_notes,
        mt5_processed,
        created_at,
        updated_at
      ) VALUES (
        v_user_id,
        'general',
        COALESCE(p_from_account_name, 'Wallet Principal'),
        p_to_account_id,
        p_to_account_name,
        p_amount,
        'USD',
        'pending',  -- Estado PENDING para aprobación
        NOW(),
        'Transferencia desde Wallet Principal a MT5 - Pendiente de aprobación',
        false,  -- No procesado en MT5 aún
        NOW(),
        NOW()
      ) RETURNING id, transfer_id INTO v_transfer_id, v_transfer_code;
      
      -- Crear notificación si la tabla existe
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        INSERT INTO public.notifications (
          user_id,
          type,
          title,
          message,
          data,
          created_at
        ) VALUES (
          v_user_id,
          'transfer_pending',
          'Transferencia Solicitada',
          format('Tu solicitud de transferencia de $%s está pendiente de aprobación', p_amount::TEXT),
          json_build_object(
            'transfer_id', v_transfer_id,
            'transfer_code', v_transfer_code,
            'amount', p_amount,
            'from', 'Wallet Principal',
            'to', p_to_account_name,
            'status', 'pending'
          ),
          NOW()
        );
      END IF;
      
      RETURN json_build_object(
        'success', true,
        'transfer_id', v_transfer_id,
        'transfer_code', v_transfer_code,
        'data', json_build_object(
          'transfer_id', v_transfer_id,
          'transfer_code', v_transfer_code,
          'amount', p_amount,
          'from', COALESCE(p_from_account_name, 'Wallet Principal'),
          'to', p_to_account_name,
          'status', 'pending',
          'message', 'Solicitud de transferencia creada exitosamente. Será procesada una vez sea aprobada por un administrador.'
        )
      );
      
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Error al crear solicitud de transferencia: ' || SQLERRM
      );
    END;
    
  -- ========================================
  -- CASO 2: Transferencia entre cuentas MT5
  -- ========================================
  ELSE
    -- Verificar cuenta origen
    IF NOT EXISTS (
      SELECT 1 FROM public.broker_accounts 
      WHERE id = p_from_account_id::UUID 
      AND user_id = v_user_id
      AND status IN ('active', 'Active', 'ACTIVE')
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cuenta origen no válida o inactiva'
      );
    END IF;
    
    -- Verificar cuenta destino
    IF NOT EXISTS (
      SELECT 1 FROM public.broker_accounts 
      WHERE id = p_to_account_id::UUID 
      AND user_id = v_user_id
      AND status IN ('active', 'Active', 'ACTIVE')
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cuenta destino no válida o inactiva'
      );
    END IF;
    
    -- Obtener balance de la cuenta origen
    SELECT balance INTO v_current_account_balance
    FROM public.broker_accounts
    WHERE id = p_from_account_id::UUID;
    
    -- Verificar fondos suficientes
    IF v_current_account_balance IS NULL OR v_current_account_balance < p_amount THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Saldo insuficiente en cuenta origen'
      );
    END IF;
    
    BEGIN
      -- Crear registro de transferencia en estado PENDING
      INSERT INTO public.internal_transfers (
        user_id,
        from_account_id,
        from_account_name,
        to_account_id,
        to_account_name,
        amount,
        currency,
        status,
        requested_at,
        admin_notes,
        mt5_processed,
        created_at,
        updated_at
      ) VALUES (
        v_user_id,
        p_from_account_id,
        p_from_account_name,
        p_to_account_id,
        p_to_account_name,
        p_amount,
        'USD',
        'pending',
        NOW(),
        'Transferencia entre cuentas MT5 - Pendiente de aprobación y procesamiento en servidor MT5',
        false,
        NOW(),
        NOW()
      ) RETURNING id, transfer_id INTO v_transfer_id, v_transfer_code;
      
      RETURN json_build_object(
        'success', true,
        'transfer_id', v_transfer_id,
        'transfer_code', v_transfer_code,
        'data', json_build_object(
          'transfer_id', v_transfer_id,
          'transfer_code', v_transfer_code,
          'amount', p_amount,
          'from', p_from_account_name,
          'to', p_to_account_name,
          'status', 'pending',
          'message', 'Solicitud de transferencia creada. Será procesada en el servidor MT5 una vez sea aprobada.'
        )
      );
      
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Error al crear solicitud de transferencia: ' || SQLERRM
      );
    END;
  END IF;
END;
$$;

-- ========================================
-- FUNCIÓN PARA APROBAR TRANSFERENCIAS (Admin)
-- ========================================
CREATE OR REPLACE FUNCTION approve_transfer_request(
  p_transfer_id UUID,
  p_mt5_from_ticket TEXT DEFAULT NULL,
  p_mt5_to_ticket TEXT DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_transfer RECORD;
  v_from_balance DECIMAL;
BEGIN
  v_admin_id := auth.uid();
  
  -- Obtener información de la transferencia
  SELECT * INTO v_transfer
  FROM public.internal_transfers
  WHERE id = p_transfer_id
  AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Transferencia no encontrada o ya procesada'
    );
  END IF;
  
  -- Si es desde wallet principal
  IF v_transfer.from_account_id = 'general' THEN
    -- Verificar balance del wallet
    SELECT broker_balance INTO v_from_balance
    FROM public.profiles
    WHERE id = v_transfer.user_id;
    
    IF v_from_balance < v_transfer.amount THEN
      -- Rechazar automáticamente si no hay fondos
      UPDATE public.internal_transfers
      SET status = 'rejected',
          rejection_reason = 'Saldo insuficiente en Wallet Principal al momento de procesar',
          approved_by = v_admin_id,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = p_transfer_id;
      
      RETURN json_build_object(
        'success', false,
        'error', 'Saldo insuficiente en Wallet Principal'
      );
    END IF;
    
    -- Actualizar balances
    UPDATE public.profiles
    SET broker_balance = broker_balance - v_transfer.amount,
        updated_at = NOW()
    WHERE id = v_transfer.user_id;
    
    UPDATE public.broker_accounts
    SET balance = COALESCE(balance, 0) + v_transfer.amount,
        updated_at = NOW()
    WHERE id = v_transfer.to_account_id::UUID;
    
  ELSE
    -- Es transferencia entre MT5 - solo marcar como aprobada
    -- El procesamiento real se hace en el servidor MT5
    NULL; -- No actualizamos balances aquí
  END IF;
  
  -- Actualizar estado de la transferencia
  UPDATE public.internal_transfers
  SET status = 'completed',
      approved_at = NOW(),
      approved_by = v_admin_id,
      completed_at = NOW(),
      mt5_processed = CASE 
        WHEN v_transfer.from_account_id = 'general' THEN true 
        ELSE COALESCE(mt5_processed, false) 
      END,
      mt5_from_ticket = COALESCE(p_mt5_from_ticket, mt5_from_ticket),
      mt5_to_ticket = COALESCE(p_mt5_to_ticket, mt5_to_ticket),
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      updated_at = NOW()
  WHERE id = p_transfer_id;
  
  -- Notificar al usuario
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    ) VALUES (
      v_transfer.user_id,
      'transfer_approved',
      'Transferencia Aprobada',
      format('Tu transferencia de $%s ha sido aprobada y procesada', v_transfer.amount::TEXT),
      json_build_object(
        'transfer_id', p_transfer_id,
        'transfer_code', v_transfer.transfer_id,
        'amount', v_transfer.amount,
        'status', 'completed'
      ),
      NOW()
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Transferencia aprobada y procesada exitosamente',
    'transfer_id', p_transfer_id,
    'mt5_processed', v_transfer.from_account_id = 'general'
  );
END;
$$;

-- ========================================
-- FUNCIÓN PARA RECHAZAR TRANSFERENCIAS (Admin)
-- ========================================
CREATE OR REPLACE FUNCTION reject_transfer_request(
  p_transfer_id UUID,
  p_rejection_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_user_id UUID;
  v_amount DECIMAL;
  v_transfer_code TEXT;
BEGIN
  v_admin_id := auth.uid();
  
  -- Obtener información de la transferencia
  SELECT user_id, amount, transfer_id 
  INTO v_user_id, v_amount, v_transfer_code
  FROM public.internal_transfers
  WHERE id = p_transfer_id
  AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Transferencia no encontrada o ya procesada'
    );
  END IF;
  
  -- Actualizar estado de la transferencia
  UPDATE public.internal_transfers
  SET status = 'rejected',
      approved_by = v_admin_id,
      approved_at = NOW(),
      rejection_reason = p_rejection_reason,
      updated_at = NOW()
  WHERE id = p_transfer_id;
  
  -- Notificar al usuario
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    ) VALUES (
      v_user_id,
      'transfer_rejected',
      'Transferencia Rechazada',
      format('Tu transferencia de $%s ha sido rechazada. Razón: %s', v_amount::TEXT, p_rejection_reason),
      json_build_object(
        'transfer_id', p_transfer_id,
        'transfer_code', v_transfer_code,
        'amount', v_amount,
        'status', 'rejected',
        'reason', p_rejection_reason
      ),
      NOW()
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Transferencia rechazada',
    'transfer_id', p_transfer_id
  );
END;
$$;

-- Comentarios descriptivos
COMMENT ON FUNCTION create_transfer_request IS 
'Crea solicitudes de transferencia en estado PENDING que requieren aprobación admin. 
Soporta transferencias desde Wallet Principal (broker_balance) a MT5 y entre cuentas MT5.';

COMMENT ON FUNCTION approve_transfer_request IS 
'Aprueba transferencias pendientes. Si es desde wallet principal, actualiza balances.
Si es entre MT5, marca como aprobada para procesamiento en servidor MT5.';

COMMENT ON FUNCTION reject_transfer_request IS 
'Rechaza transferencias pendientes y notifica al usuario con la razón del rechazo.';