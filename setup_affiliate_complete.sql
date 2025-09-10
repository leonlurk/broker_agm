-- =====================================================
-- CONFIGURACIÓN COMPLETA DEL SISTEMA DE AFILIADOS
-- =====================================================

-- 1. INSERTAR CONFIGURACIÓN DE NIVELES DE AFILIADOS
INSERT INTO affiliate_tiers (
    tier_level,
    tier_name,
    min_referrals,
    max_referrals,
    commission_rate,
    market_direct_commission,
    institutional_commission,
    min_payout,
    bonuses,
    created_at,
    updated_at
) VALUES 
    -- Tier 1: Bronze (0-99 referidos)
    (
        1,
        'Bronze',
        0,
        99,
        0.10, -- 10% commission rate
        3.00, -- $3.00 USD por lote Market Direct
        1.50, -- $1.50 USD por lote Institucional
        50.00, -- Pago mínimo $50
        '[]'::jsonb,
        NOW(),
        NOW()
    ),
    -- Tier 2: Silver (100-199 referidos)
    (
        2,
        'Silver',
        100,
        199,
        0.15, -- 15% commission rate
        3.50, -- $3.50 USD por lote Market Direct
        1.75, -- $1.75 USD por lote Institucional
        25.00, -- Pago mínimo $25
        '["priority_support"]'::jsonb,
        NOW(),
        NOW()
    ),
    -- Tier 3: Gold (200+ referidos)
    (
        3,
        'Gold',
        200,
        999999,
        0.20, -- 20% commission rate
        4.00, -- $4.00 USD por lote Market Direct
        2.00, -- $2.00 USD por lote Institucional
        10.00, -- Pago mínimo $10
        '["priority_support", "exclusive_materials", "vip_events"]'::jsonb,
        NOW(),
        NOW()
    )
ON CONFLICT (tier_level) DO UPDATE SET
    tier_name = EXCLUDED.tier_name,
    min_referrals = EXCLUDED.min_referrals,
    max_referrals = EXCLUDED.max_referrals,
    commission_rate = EXCLUDED.commission_rate,
    market_direct_commission = EXCLUDED.market_direct_commission,
    institutional_commission = EXCLUDED.institutional_commission,
    min_payout = EXCLUDED.min_payout,
    bonuses = EXCLUDED.bonuses,
    updated_at = NOW();

-- 2. CREAR O ACTUALIZAR FUNCIÓN PARA REGISTRAR REFERIDOS
CREATE OR REPLACE FUNCTION register_referral(
    p_referrer_id UUID,
    p_referred_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Verificar que no exista ya este referido
    SELECT EXISTS(
        SELECT 1 FROM user_referrals 
        WHERE referrer_user_id = p_referrer_id 
        AND referred_user_id = p_referred_id
    ) INTO v_exists;
    
    IF v_exists THEN
        RETURN FALSE; -- Ya existe
    END IF;
    
    -- Insertar en user_referrals
    INSERT INTO user_referrals (
        referrer_user_id,
        referred_user_id,
        status,
        commission_earned,
        created_at,
        updated_at
    ) VALUES (
        p_referrer_id,
        p_referred_id,
        'active',
        0.00,
        NOW(),
        NOW()
    );
    
    -- Incrementar referral_count del referrer
    UPDATE users 
    SET 
        referral_count = COALESCE(referral_count, 0) + 1,
        updated_at = NOW()
    WHERE id = p_referrer_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error en register_referral: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREAR FUNCIÓN PARA CALCULAR TIER ACTUAL DE UN USUARIO
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS TABLE (
    tier_level INTEGER,
    tier_name TEXT,
    commission_rate NUMERIC,
    market_direct_commission NUMERIC,
    institutional_commission NUMERIC,
    min_payout NUMERIC
) AS $$
DECLARE
    v_referral_count INTEGER;
BEGIN
    -- Obtener cantidad de referidos del usuario
    SELECT COALESCE(referral_count, 0) 
    INTO v_referral_count
    FROM users 
    WHERE id = p_user_id;
    
    -- Retornar el tier correspondiente
    RETURN QUERY
    SELECT 
        at.tier_level,
        at.tier_name,
        at.commission_rate,
        at.market_direct_commission,
        at.institutional_commission,
        at.min_payout
    FROM affiliate_tiers at
    WHERE v_referral_count >= at.min_referrals 
    AND v_referral_count <= at.max_referrals
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREAR FUNCIÓN PARA CALCULAR COMISIONES PENDIENTES
CREATE OR REPLACE FUNCTION calculate_pending_commissions(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_total_pending NUMERIC;
BEGIN
    SELECT COALESCE(SUM(commission_amount), 0)
    INTO v_total_pending
    FROM affiliate_commissions
    WHERE affiliate_id = p_user_id
    AND status = 'pending';
    
    RETURN v_total_pending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREAR TRIGGER PARA AUTO-REGISTRAR REFERIDOS AL CREAR USUARIO
CREATE OR REPLACE FUNCTION auto_register_referral_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el nuevo usuario tiene un referred_by, registrar el referido
    IF NEW.referred_by IS NOT NULL THEN
        PERFORM register_referral(NEW.referred_by, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y volver a crearlo
DROP TRIGGER IF EXISTS auto_register_referral_trigger ON users;
CREATE TRIGGER auto_register_referral_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION auto_register_referral_on_user_insert();

-- 6. CREAR FUNCIÓN PARA GENERAR COMISIÓN
CREATE OR REPLACE FUNCTION generate_affiliate_commission(
    p_affiliate_id UUID,
    p_referred_user_id UUID,
    p_operation_type TEXT, -- 'market_direct' o 'institutional'
    p_lots NUMERIC,
    p_operation_details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_commission_id UUID;
    v_tier RECORD;
    v_commission_amount NUMERIC;
    v_commission_rate NUMERIC;
BEGIN
    -- Obtener tier del afiliado
    SELECT * INTO v_tier FROM get_user_tier(p_affiliate_id);
    
    IF v_tier IS NULL THEN
        RAISE EXCEPTION 'No se encontró tier para el afiliado';
    END IF;
    
    -- Calcular comisión según tipo de operación
    IF p_operation_type = 'market_direct' THEN
        v_commission_amount := p_lots * v_tier.market_direct_commission;
    ELSIF p_operation_type = 'institutional' THEN
        v_commission_amount := p_lots * v_tier.institutional_commission;
    ELSE
        RAISE EXCEPTION 'Tipo de operación no válido: %', p_operation_type;
    END IF;
    
    -- Generar ID para la comisión
    v_commission_id := gen_random_uuid();
    
    -- Insertar comisión
    INSERT INTO affiliate_commissions (
        id,
        affiliate_id,
        referred_user_id,
        commission_amount,
        commission_type,
        status,
        tier_at_time,
        created_at,
        updated_at
    ) VALUES (
        v_commission_id,
        p_affiliate_id,
        p_referred_user_id,
        v_commission_amount,
        p_operation_type,
        'pending',
        v_tier.tier_level,
        NOW(),
        NOW()
    );
    
    -- Actualizar commission_earned en user_referrals
    UPDATE user_referrals
    SET 
        commission_earned = commission_earned + v_commission_amount,
        updated_at = NOW()
    WHERE referrer_user_id = p_affiliate_id
    AND referred_user_id = p_referred_user_id;
    
    RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREAR FUNCIÓN PARA PROCESAR PAGOS DE AFILIADOS
CREATE OR REPLACE FUNCTION process_affiliate_payment(
    p_affiliate_id UUID,
    p_payment_method TEXT,
    p_payment_details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
    v_total_pending NUMERIC;
    v_tier RECORD;
    v_commission_ids UUID[];
BEGIN
    -- Obtener tier del afiliado para verificar min_payout
    SELECT * INTO v_tier FROM get_user_tier(p_affiliate_id);
    
    -- Calcular total pendiente
    v_total_pending := calculate_pending_commissions(p_affiliate_id);
    
    -- Verificar monto mínimo
    IF v_total_pending < v_tier.min_payout THEN
        RAISE EXCEPTION 'Monto pendiente (%) es menor al mínimo requerido (%)', 
            v_total_pending, v_tier.min_payout;
    END IF;
    
    -- Obtener IDs de comisiones pendientes
    SELECT ARRAY_AGG(id) INTO v_commission_ids
    FROM affiliate_commissions
    WHERE affiliate_id = p_affiliate_id
    AND status = 'pending';
    
    -- Generar ID para el pago
    v_payment_id := gen_random_uuid();
    
    -- Crear registro de pago
    INSERT INTO affiliate_payments (
        id,
        affiliate_id,
        amount,
        payment_method,
        payment_details,
        status,
        commission_ids,
        created_at,
        processed_at
    ) VALUES (
        v_payment_id,
        p_affiliate_id,
        v_total_pending,
        p_payment_method,
        p_payment_details,
        'processing',
        v_commission_ids,
        NOW(),
        NULL
    );
    
    -- Marcar comisiones como procesadas
    UPDATE affiliate_commissions
    SET 
        status = 'processing',
        payment_id = v_payment_id,
        updated_at = NOW()
    WHERE id = ANY(v_commission_ids);
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CREAR POLÍTICAS RLS
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payments ENABLE ROW LEVEL SECURITY;

-- Política: usuarios pueden ver sus propios referidos
CREATE POLICY "Users can view own referrals" ON user_referrals
    FOR SELECT USING (auth.uid() = referrer_user_id);

-- Política: usuarios pueden ver sus propias comisiones
CREATE POLICY "Users can view own commissions" ON affiliate_commissions
    FOR SELECT USING (auth.uid() = affiliate_id);

-- Política: usuarios pueden ver sus propios pagos
CREATE POLICY "Users can view own payments" ON affiliate_payments
    FOR SELECT USING (auth.uid() = affiliate_id);

-- 9. CREAR ÍNDICES PARA MEJORAR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_affiliate ON affiliate_payments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_count ON users(referral_count);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- 10. VERIFICACIÓN FINAL DEL SISTEMA
SELECT 
    '=== VERIFICACIÓN DEL SISTEMA DE AFILIADOS ===' as info;

-- Verificar tiers configurados
SELECT 
    'Tiers configurados' as componente,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) >= 3 THEN '✅ OK' ELSE '❌ Faltan tiers' END as estado
FROM affiliate_tiers;

-- Verificar funciones creadas
SELECT 
    'Funciones del sistema' as componente,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) >= 6 THEN '✅ OK' ELSE '❌ Faltan funciones' END as estado
FROM pg_proc 
WHERE proname IN (
    'register_referral',
    'get_user_tier',
    'calculate_pending_commissions',
    'generate_affiliate_commission',
    'process_affiliate_payment',
    'auto_register_referral_on_user_insert'
);

-- Verificar trigger
SELECT 
    'Trigger auto-registro' as componente,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) = 1 THEN '✅ OK' ELSE '❌ Falta trigger' END as estado
FROM information_schema.triggers
WHERE trigger_name = 'auto_register_referral_trigger';

-- Verificar políticas RLS
SELECT 
    'Políticas RLS' as componente,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) >= 3 THEN '✅ OK' ELSE '❌ Faltan políticas' END as estado
FROM pg_policies 
WHERE tablename IN ('user_referrals', 'affiliate_commissions', 'affiliate_payments');

-- Verificar índices
SELECT 
    'Índices de performance' as componente,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) >= 7 THEN '✅ OK' ELSE '⚠️ Faltan índices' END as estado
FROM pg_indexes
WHERE indexname LIKE 'idx_%referral%' 
   OR indexname LIKE 'idx_%affiliate%'
   OR indexname LIKE 'idx_users_referred%';

-- Resumen de tiers
SELECT 
    '=== CONFIGURACIÓN DE TIERS ===' as info;
SELECT 
    tier_level,
    tier_name,
    min_referrals || '-' || max_referrals as rango_referidos,
    (commission_rate * 100) || '%' as comision_porcentaje,
    '$' || market_direct_commission || ' USD' as comision_market_direct,
    '$' || institutional_commission || ' USD' as comision_institutional,
    '$' || min_payout || ' USD' as pago_minimo
FROM affiliate_tiers
ORDER BY tier_level;

-- Mensaje final
SELECT 
    '🎉 SISTEMA DE AFILIADOS CONFIGURADO Y LISTO PARA TESTEAR' as mensaje,
    'El trigger registrará automáticamente los referidos cuando se cree un usuario con referred_by' as nota;