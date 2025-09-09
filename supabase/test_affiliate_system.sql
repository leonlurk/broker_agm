-- =====================================================
-- SCRIPT DE PRUEBA PARA SISTEMA DE AFILIADOS
-- =====================================================
-- Este script simula el flujo completo del sistema de afiliados
-- Puedes ejecutarlo en Supabase SQL Editor para verificar que todo funciona

-- PASO 1: Agregar columna faltante (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'total_commissions_earned') THEN
        ALTER TABLE public.profiles ADD COLUMN total_commissions_earned DECIMAL(12,2) DEFAULT 0.00;
        RAISE NOTICE '✅ Columna total_commissions_earned agregada';
    END IF;
END $$;

-- =====================================================
-- FUNCIÓN PARA PROCESAR TRADE (necesaria para las pruebas)
-- =====================================================
CREATE OR REPLACE FUNCTION process_trade_commission(
    p_trade_id VARCHAR,
    p_account_number VARCHAR,
    p_account_type VARCHAR,
    p_symbol VARCHAR,
    p_lots DECIMAL,
    p_trade_date TIMESTAMPTZ,
    p_user_id UUID DEFAULT NULL -- Opcional: para pruebas directas
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_referral_id UUID;
    v_referrer_id UUID;
    v_tier INTEGER;
    v_commission DECIMAL;
    v_is_eligible BOOLEAN;
    v_commission_per_lot DECIMAL;
BEGIN
    -- Si se proporciona user_id directamente (para pruebas)
    IF p_user_id IS NOT NULL THEN
        v_user_id := p_user_id;
    ELSE
        -- Buscar el usuario dueño de la cuenta
        SELECT user_id INTO v_user_id
        FROM public.trading_accounts
        WHERE account_number = p_account_number;
    END IF;
    
    -- Si no se encuentra usuario, retornar error
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usuario no encontrado',
            'account_number', p_account_number
        );
    END IF;
    
    -- Buscar si este usuario fue referido
    SELECT id, referrer_user_id INTO v_referral_id, v_referrer_id
    FROM public.user_referrals
    WHERE referred_user_id = v_user_id
    AND status = 'active';
    
    -- Si no fue referido, retornar info
    IF v_referral_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'info', 'Usuario no fue referido o referral no está activo',
            'user_id', v_user_id
        );
    END IF;
    
    -- Obtener tier del referrer
    SELECT affiliate_tier INTO v_tier
    FROM public.profiles
    WHERE id = v_referrer_id;
    
    -- Calcular comisión
    v_commission := calculate_commission(p_lots, v_tier, p_account_type, p_symbol);
    v_is_eligible := (v_commission > 0);
    
    IF p_lots > 0 THEN
        v_commission_per_lot := v_commission / p_lots;
    ELSE
        v_commission_per_lot := 0;
    END IF;
    
    -- Insertar en historial de comisiones
    INSERT INTO public.commission_history (
        referral_id,
        trade_id,
        account_number,
        account_type,
        symbol,
        lots,
        commission_per_lot,
        total_commission,
        tier_level,
        is_eligible,
        trade_date
    ) VALUES (
        v_referral_id,
        p_trade_id,
        p_account_number,
        p_account_type,
        p_symbol,
        p_lots,
        v_commission_per_lot,
        v_commission,
        v_tier,
        v_is_eligible,
        p_trade_date
    ) ON CONFLICT (trade_id) DO NOTHING;
    
    -- Si se insertó la comisión, actualizar balances
    IF FOUND AND v_commission > 0 THEN
        -- Actualizar el referral
        UPDATE public.user_referrals
        SET 
            commission_earned = commission_earned + v_commission,
            total_lots_traded = total_lots_traded + p_lots,
            last_commission_date = p_trade_date,
            updated_at = NOW()
        WHERE id = v_referral_id;
        
        -- Actualizar balance del referrer
        UPDATE public.profiles
        SET 
            commission_balance = commission_balance + v_commission,
            total_commissions_earned = total_commissions_earned + v_commission
        WHERE id = v_referrer_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'commission_calculated', v_commission,
            'commission_per_lot', v_commission_per_lot,
            'tier', v_tier,
            'referrer_id', v_referrer_id,
            'is_eligible', v_is_eligible,
            'symbol', p_symbol,
            'account_type', p_account_type,
            'lots', p_lots
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'info', 'No se generó comisión',
            'is_eligible', v_is_eligible,
            'commission', v_commission,
            'tier', v_tier,
            'symbol', p_symbol,
            'account_type', p_account_type
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN DE PRUEBA: SIMULAR REGISTRO CON REFERRAL
-- =====================================================
CREATE OR REPLACE FUNCTION test_create_referral(
    referrer_email VARCHAR,
    referred_email VARCHAR
)
RETURNS JSONB AS $$
DECLARE
    v_referrer_id UUID;
    v_referred_id UUID;
    v_result JSONB;
BEGIN
    -- Buscar IDs de los usuarios
    SELECT id INTO v_referrer_id FROM profiles WHERE email = referrer_email;
    SELECT id INTO v_referred_id FROM profiles WHERE email = referred_email;
    
    IF v_referrer_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Referrer no encontrado: ' || referrer_email);
    END IF;
    
    IF v_referred_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Referred no encontrado: ' || referred_email);
    END IF;
    
    -- Actualizar referred_by en profiles
    UPDATE profiles 
    SET referred_by = v_referrer_id 
    WHERE id = v_referred_id;
    
    -- Crear o actualizar referral
    INSERT INTO user_referrals (
        referrer_user_id,
        referred_user_id,
        status,
        tier_at_registration
    ) VALUES (
        v_referrer_id,
        v_referred_id,
        'active', -- Lo ponemos activo directamente para pruebas
        (SELECT affiliate_tier FROM profiles WHERE id = v_referrer_id)
    )
    ON CONFLICT (referred_user_id) 
    DO UPDATE SET 
        status = 'active',
        updated_at = NOW();
    
    -- Actualizar contador del referrer
    UPDATE profiles 
    SET referral_count = (
        SELECT COUNT(*) FROM user_referrals 
        WHERE referrer_user_id = v_referrer_id
    )
    WHERE id = v_referrer_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'referrer_id', v_referrer_id,
        'referred_id', v_referred_id,
        'message', 'Referral creado exitosamente'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN DE PRUEBA: SIMULAR MÚLTIPLES TRADES
-- =====================================================
CREATE OR REPLACE FUNCTION test_simulate_trades(
    user_email VARCHAR,
    num_trades INTEGER DEFAULT 5
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_results JSONB[] := '{}';
    v_trade_result JSONB;
    v_symbols TEXT[] := ARRAY['EURUSD', 'GBPUSD', 'GOLD', 'USDJPY', 'BTCUSD', 'SP500', 'SILVER'];
    v_account_types TEXT[] := ARRAY['Market Direct', 'Institucional'];
    i INTEGER;
    v_symbol TEXT;
    v_account_type TEXT;
    v_lots DECIMAL;
    v_total_commission DECIMAL := 0;
BEGIN
    -- Buscar usuario
    SELECT id INTO v_user_id FROM profiles WHERE email = user_email;
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Usuario no encontrado: ' || user_email);
    END IF;
    
    -- Simular trades
    FOR i IN 1..num_trades LOOP
        -- Seleccionar símbolo aleatorio
        v_symbol := v_symbols[1 + floor(random() * array_length(v_symbols, 1))];
        
        -- Seleccionar tipo de cuenta aleatorio
        v_account_type := v_account_types[1 + floor(random() * 2)];
        
        -- Generar lotes aleatorios (entre 0.1 y 5)
        v_lots := round((0.1 + random() * 4.9)::numeric, 2);
        
        -- Procesar trade
        v_trade_result := process_trade_commission(
            'TEST_' || gen_random_uuid()::text,
            'TEST_ACCOUNT_' || v_user_id::text,
            v_account_type,
            v_symbol,
            v_lots,
            NOW(),
            v_user_id
        );
        
        -- Agregar al resultado
        v_results := array_append(v_results, v_trade_result);
        
        -- Sumar comisión si se generó
        IF (v_trade_result->>'success')::boolean AND v_trade_result->>'commission_calculated' IS NOT NULL THEN
            v_total_commission := v_total_commission + (v_trade_result->>'commission_calculated')::decimal;
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'trades_simulated', num_trades,
        'total_commission_generated', v_total_commission,
        'trades', to_jsonb(v_results)
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN DE PRUEBA: VER ESTADO DE AFILIADO
-- =====================================================
CREATE OR REPLACE FUNCTION test_view_affiliate_status(user_email VARCHAR)
RETURNS TABLE(
    user_id UUID,
    email VARCHAR,
    username VARCHAR,
    referral_count INTEGER,
    affiliate_tier INTEGER,
    commission_balance DECIMAL,
    total_commissions_earned DECIMAL,
    active_referrals BIGINT,
    total_lots_traded DECIMAL,
    tier_name VARCHAR,
    commission_market_direct DECIMAL,
    commission_institutional DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.username,
        p.referral_count,
        p.affiliate_tier,
        p.commission_balance,
        p.total_commissions_earned,
        (SELECT COUNT(*) FROM user_referrals WHERE referrer_user_id = p.id AND status = 'active'),
        (SELECT SUM(total_lots_traded) FROM user_referrals WHERE referrer_user_id = p.id),
        t.name,
        t.commission_market_direct,
        t.commission_institutional
    FROM profiles p
    LEFT JOIN affiliate_tiers t ON p.affiliate_tier = t.tier_level
    WHERE p.email = user_email;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EJEMPLOS DE USO
-- =====================================================

-- 1. CREAR UN REFERRAL DE PRUEBA
-- Reemplaza los emails con usuarios reales de tu sistema
/*
SELECT test_create_referral(
    'afiliado@example.com',  -- Email del que refiere
    'nuevo@example.com'      -- Email del referido
);
*/

-- 2. SIMULAR TRADES PARA UN USUARIO
-- Esto generará comisiones si el usuario fue referido
/*
SELECT test_simulate_trades(
    'nuevo@example.com',  -- Email del usuario que opera
    10                    -- Número de trades a simular
);
*/

-- 3. VER ESTADO DE UN AFILIADO
/*
SELECT * FROM test_view_affiliate_status('afiliado@example.com');
*/

-- 4. VER TODAS LAS COMISIONES GENERADAS
/*
SELECT 
    ch.*,
    ur.referrer_user_id,
    p.email as referrer_email
FROM commission_history ch
JOIN user_referrals ur ON ch.referral_id = ur.id
JOIN profiles p ON ur.referrer_user_id = p.id
ORDER BY ch.created_at DESC
LIMIT 20;
*/

-- 5. VER RESUMEN DE AFILIADOS TOP
/*
SELECT 
    p.email,
    p.username,
    p.referral_count,
    p.affiliate_tier,
    p.commission_balance,
    p.total_commissions_earned,
    COUNT(DISTINCT ur.id) as active_referrals,
    SUM(ur.total_lots_traded) as total_lots
FROM profiles p
LEFT JOIN user_referrals ur ON p.id = ur.referrer_user_id AND ur.status = 'active'
WHERE p.referral_count > 0
GROUP BY p.id, p.email, p.username, p.referral_count, p.affiliate_tier, p.commission_balance, p.total_commissions_earned
ORDER BY p.total_commissions_earned DESC
LIMIT 10;
*/

-- =====================================================
-- FUNCIÓN PARA LIMPIAR DATOS DE PRUEBA
-- =====================================================
CREATE OR REPLACE FUNCTION test_cleanup_test_data()
RETURNS JSONB AS $$
DECLARE
    v_deleted_trades INTEGER;
BEGIN
    -- Eliminar solo trades de prueba
    DELETE FROM commission_history 
    WHERE trade_id LIKE 'TEST_%';
    
    GET DIAGNOSTICS v_deleted_trades = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'deleted_test_trades', v_deleted_trades
    );
END;
$$ LANGUAGE plpgsql;

-- Limpieza: SELECT test_cleanup_test_data();