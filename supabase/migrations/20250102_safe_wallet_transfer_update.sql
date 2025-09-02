-- =====================================================
-- MIGRACIÓN SEGURA: Sistema de Wallet Principal para AGM Broker
-- Esta migración es NO INVASIVA y agrega funcionalidad sin romper nada existente
-- Fecha: 2025-01-02
-- =====================================================

-- 1. AGREGAR COLUMNA broker_balance A LA TABLA users (si no existe)
-- Esta columna almacenará el balance principal del wallet del usuario
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'broker_balance'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN broker_balance DECIMAL(20, 2) DEFAULT 0.00;
        
        COMMENT ON COLUMN public.users.broker_balance IS 
        'Balance principal del wallet del broker. Los depósitos van aquí primero, luego se transfieren a cuentas MT5';
    END IF;
END $$;

-- 2. CREAR TABLA internal_transfers SI NO EXISTE
-- Esta tabla registrará las transferencias entre wallet principal y cuentas MT5
CREATE TABLE IF NOT EXISTS public.internal_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Usuario que realiza la transferencia
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Información de origen (puede ser 'general' para wallet principal)
    from_account_id TEXT NOT NULL,
    from_account_name TEXT NOT NULL,
    
    -- Información de destino
    to_account_id TEXT NOT NULL,
    to_account_name TEXT NOT NULL,
    
    -- Detalles de la transferencia
    amount DECIMAL(20, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Metadata adicional
    notes TEXT,
    error_message TEXT
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_internal_transfers_user_id ON public.internal_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_status ON public.internal_transfers(status);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_requested_at ON public.internal_transfers(requested_at DESC);

-- 3. CREAR O REEMPLAZAR FUNCIÓN RPC PARA TRANSFERENCIAS
-- Esta función maneja transferencias desde wallet principal a cuentas MT5
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

  -- CASO 1: Transferencia desde Wallet Principal (balance general) a cuenta MT5
  IF p_from_account_id = 'general' THEN
    
    -- Obtener el balance actual del wallet principal
    SELECT broker_balance INTO v_current_broker_balance
    FROM public.users
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
      SELECT 1 FROM public.trading_accounts 
      WHERE id = p_to_account_id::UUID 
      AND user_id = v_user_id
      AND status = 'Active'
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cuenta MT5 destino no válida o inactiva'
      );
    END IF;
    
    -- Iniciar transacción
    BEGIN
      -- Actualizar balance del wallet principal (restar)
      UPDATE public.users
      SET broker_balance = broker_balance - p_amount,
          updated_at = NOW()
      WHERE id = v_user_id;
      
      -- Actualizar balance de la cuenta MT5 (sumar)
      UPDATE public.trading_accounts
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
        processed_at
      ) VALUES (
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
      
      RETURN json_build_object(
        'success', true,
        'transfer_id', v_transfer_id,
        'data', json_build_object(
          'transfer_id', v_transfer_id,
          'amount', p_amount,
          'from', p_from_account_name,
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
    
  -- CASO 2: Transferencia entre cuentas MT5 (mantener funcionalidad existente)
  ELSE
    -- Verificar que ambas cuentas existen y pertenecen al usuario
    IF NOT EXISTS (
      SELECT 1 FROM public.trading_accounts 
      WHERE id = p_from_account_id::UUID 
      AND user_id = v_user_id
      AND status = 'Active'
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cuenta origen no válida o inactiva'
      );
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM public.trading_accounts 
      WHERE id = p_to_account_id::UUID 
      AND user_id = v_user_id
      AND status = 'Active'
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cuenta destino no válida o inactiva'
      );
    END IF;
    
    -- Obtener balance de la cuenta origen
    SELECT balance INTO v_current_account_balance
    FROM public.trading_accounts
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
      UPDATE public.trading_accounts
      SET balance = balance - p_amount,
          updated_at = NOW()
      WHERE id = p_from_account_id::UUID;
      
      -- Actualizar balance cuenta destino (sumar)
      UPDATE public.trading_accounts
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
        processed_at
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
'Maneja transferencias desde Wallet Principal (broker_balance) a cuentas MT5, o entre cuentas MT5. 
Cuando from_account_id = "general", transfiere desde el wallet principal.';

-- 4. FUNCIÓN AUXILIAR PARA OBTENER BALANCE DEL WALLET
CREATE OR REPLACE FUNCTION get_user_broker_balance(p_user_id UUID DEFAULT NULL)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_balance DECIMAL;
BEGIN
  -- Si no se proporciona user_id, usar el del usuario actual
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT broker_balance INTO v_balance
  FROM public.users
  WHERE id = v_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$;

-- 5. FUNCIÓN PARA ACTUALIZAR BALANCE DEL WALLET (para depósitos)
CREATE OR REPLACE FUNCTION update_broker_balance(
  p_amount DECIMAL,
  p_operation TEXT -- 'add' o 'subtract'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_new_balance DECIMAL;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no autenticado'
    );
  END IF;
  
  IF p_operation = 'add' THEN
    UPDATE public.users
    SET broker_balance = COALESCE(broker_balance, 0) + p_amount,
        updated_at = NOW()
    WHERE id = v_user_id
    RETURNING broker_balance INTO v_new_balance;
  ELSIF p_operation = 'subtract' THEN
    -- Verificar que hay fondos suficientes
    IF (SELECT broker_balance FROM public.users WHERE id = v_user_id) < p_amount THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Saldo insuficiente'
      );
    END IF;
    
    UPDATE public.users
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
    'new_balance', v_new_balance
  );
END;
$$;

-- =====================================================
-- NOTA IMPORTANTE:
-- Esta migración es SEGURA y NO INVASIVA porque:
-- 1. Solo agrega columnas nuevas si no existen
-- 2. Crea tablas nuevas solo si no existen
-- 3. Usa CREATE OR REPLACE para funciones (no rompe las existentes)
-- 4. Todos los cambios son aditivos, no destructivos
-- 5. Es compatible con tu esquema actual
-- =====================================================