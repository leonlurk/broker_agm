-- =====================================================
-- FUNCIÓN RPC PARA TRANSFERENCIAS WALLET → MT5
-- Compatible con tu estructura actual de base de datos
-- Fecha: 2025-01-02
-- =====================================================

-- PRIMERO: Eliminar la función existente si existe
DROP FUNCTION IF EXISTS create_transfer_request(text,text,text,text,numeric);

-- AHORA: Crear la función actualizada
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
  -- CASO 1: Transferencia desde Wallet Principal (broker_balance) → MT5
  -- ========================================
  IF p_from_account_id = 'general' THEN
    
    -- Obtener el balance actual del wallet principal desde profiles
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
    
    -- Verificar que la cuenta MT5 destino existe y pertenece al usuario
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
    
    -- Iniciar transacción
    BEGIN
      -- Actualizar balance del wallet principal en profiles (restar)
      UPDATE public.profiles
      SET broker_balance = broker_balance - p_amount,
          updated_at = NOW()
      WHERE id = v_user_id;
      
      -- Actualizar balance de la cuenta MT5 en broker_accounts (sumar)
      UPDATE public.broker_accounts
      SET balance = COALESCE(balance, 0) + p_amount,
          updated_at = NOW()
      WHERE id = p_to_account_id::UUID;
      
      -- Crear registro en internal_transfers
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
        -- processed_at no existe en tu tabla
        approved_at,
        completed_at
      ) VALUES (
        v_user_id,
        'general',
        COALESCE(p_from_account_name, 'Wallet Principal'),
        p_to_account_id,
        p_to_account_name,
        p_amount,
        'USD',
        'completed',
        NOW(),
        NOW(),
        NOW()
      ) RETURNING id INTO v_transfer_id;
      
      -- Opcional: Registrar en la tabla de notificaciones si existe
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
          'transfer_completed',
          'Transferencia Completada',
          format('Transferencia de $%s desde Wallet Principal a %s completada', p_amount::TEXT, p_to_account_name),
          json_build_object(
            'transfer_id', v_transfer_id,
            'amount', p_amount,
            'from', 'Wallet Principal',
            'to', p_to_account_name
          ),
          NOW()
        );
      END IF;
      
      RETURN json_build_object(
        'success', true,
        'transfer_id', v_transfer_id,
        'data', json_build_object(
          'transfer_id', v_transfer_id,
          'amount', p_amount,
          'from', COALESCE(p_from_account_name, 'Wallet Principal'),
          'to', p_to_account_name,
          'status', 'completed',
          'new_broker_balance', (v_current_broker_balance - p_amount)
        )
      );
      
    EXCEPTION WHEN OTHERS THEN
      -- Rollback implícito en caso de error
      RETURN json_build_object(
        'success', false,
        'error', 'Error al procesar la transferencia: ' || SQLERRM
      );
    END;
    
  -- ========================================
  -- CASO 2: Transferencia entre cuentas MT5 (funcionalidad existente)
  -- ========================================
  ELSE
    -- Verificar que ambas cuentas existen y pertenecen al usuario
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
    
    -- Procesar transferencia entre cuentas MT5
    BEGIN
      -- Actualizar balance cuenta origen (restar)
      UPDATE public.broker_accounts
      SET balance = balance - p_amount,
          updated_at = NOW()
      WHERE id = p_from_account_id::UUID;
      
      -- Actualizar balance cuenta destino (sumar)
      UPDATE public.broker_accounts
      SET balance = COALESCE(balance, 0) + p_amount,
          updated_at = NOW()
      WHERE id = p_to_account_id::UUID;
      
      -- Crear registro de transferencia
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
        approved_at,
        completed_at
      ) VALUES (
        v_user_id,
        p_from_account_id,
        p_from_account_name,
        p_to_account_id,
        p_to_account_name,
        p_amount,
        'USD',
        'completed',
        NOW(),
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

-- Agregar comentario descriptivo
COMMENT ON FUNCTION create_transfer_request IS 
'Maneja transferencias desde Wallet Principal (profiles.broker_balance) a cuentas MT5 (broker_accounts), o entre cuentas MT5. 
Cuando from_account_id = "general", transfiere desde el wallet principal.';

-- ========================================
-- FUNCIONES AUXILIARES ÚTILES (Solo si no existen)
-- ========================================

-- Eliminar si existe y recrear
DROP FUNCTION IF EXISTS get_user_broker_balance(UUID);
DROP FUNCTION IF EXISTS get_user_broker_balance();

-- Función para obtener el balance del wallet principal
CREATE OR REPLACE FUNCTION get_user_broker_balance(p_user_id UUID DEFAULT NULL)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_balance DECIMAL;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT broker_balance INTO v_balance
  FROM public.profiles
  WHERE id = v_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$;

-- Eliminar si existe y recrear
DROP FUNCTION IF EXISTS update_broker_balance(DECIMAL, TEXT);

-- Función para actualizar el balance del wallet (para depósitos/retiros)
CREATE OR REPLACE FUNCTION update_broker_balance(
  p_amount DECIMAL,
  p_operation TEXT -- 'add' para depósitos, 'subtract' para retiros
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_new_balance DECIMAL;
  v_current_balance DECIMAL;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no autenticado'
    );
  END IF;
  
  -- Obtener balance actual
  SELECT broker_balance INTO v_current_balance
  FROM public.profiles
  WHERE id = v_user_id;
  
  IF p_operation = 'add' THEN
    UPDATE public.profiles
    SET broker_balance = COALESCE(broker_balance, 0) + p_amount,
        updated_at = NOW()
    WHERE id = v_user_id
    RETURNING broker_balance INTO v_new_balance;
    
  ELSIF p_operation = 'subtract' THEN
    -- Verificar fondos suficientes
    IF COALESCE(v_current_balance, 0) < p_amount THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Saldo insuficiente en Wallet Principal',
        'current_balance', COALESCE(v_current_balance, 0),
        'requested_amount', p_amount
      );
    END IF;
    
    UPDATE public.profiles
    SET broker_balance = broker_balance - p_amount,
        updated_at = NOW()
    WHERE id = v_user_id
    RETURNING broker_balance INTO v_new_balance;
    
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Operación no válida. Use "add" o "subtract"'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'previous_balance', COALESCE(v_current_balance, 0),
    'operation', p_operation,
    'amount', p_amount
  );
END;
$$;

-- ========================================
-- PERMISOS Y POLÍTICAS DE SEGURIDAD (Solo si no existen)
-- ========================================

-- Habilitar RLS solo si no está habilitado
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'internal_transfers' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.internal_transfers ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Crear políticas solo si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'internal_transfers' 
        AND policyname = 'Users can view their own transfers'
    ) THEN
        CREATE POLICY "Users can view their own transfers" ON public.internal_transfers
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'internal_transfers' 
        AND policyname = 'Users can insert their own transfers'
    ) THEN
        CREATE POLICY "Users can insert their own transfers" ON public.internal_transfers
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ========================================
-- CONFIRMACIÓN
-- ========================================
DO $$ 
BEGIN
    RAISE NOTICE 'Migración completada exitosamente:';
    RAISE NOTICE '✅ Función create_transfer_request actualizada';
    RAISE NOTICE '✅ Función get_user_broker_balance creada/actualizada';
    RAISE NOTICE '✅ Función update_broker_balance creada/actualizada';
    RAISE NOTICE '✅ Políticas RLS configuradas';
END $$;