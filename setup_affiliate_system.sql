-- =====================================================
-- CONFIGURACIÓN INICIAL DEL SISTEMA DE AFILIADOS
-- =====================================================

-- 1. CONFIGURAR LOS NIVELES (TIERS) DE AFILIADOS
-- Primero verificamos si ya existen datos
SELECT COUNT(*) as tiers_existentes FROM affiliate_tiers;

-- Si no hay datos, insertar la configuración de niveles
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
    -- Tier 1: 0-99 referidos
    (
        1,
        'Bronze',
        0,
        99,
        0.10, -- 10% commission rate (si usas porcentaje)
        3.00, -- $3.00 USD por lote Market Direct
        1.50, -- $1.50 USD por lote Institucional
        50.00, -- Pago mínimo $50
        '[]'::jsonb,
        NOW(),
        NOW()
    ),
    -- Tier 2: 100-199 referidos
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
    -- Tier 3: 200+ referidos
    (
        3,
        'Gold',
        200,
        999999,
        0.20, -- 20% commission rate
        4.00, -- $4.00 USD por lote Market Direct
        2.00, -- $2.00 USD por lote Institucional
        10.00, -- Pago mínimo $10
        '["priority_support", "exclusive_materials"]'::jsonb,
        NOW(),
        NOW()
    )
ON CONFLICT DO NOTHING; -- No hacer nada si ya existen

-- 2. VERIFICAR QUE LA FUNCIÓN increment_referral_count EXISTE
-- Esta función debería ejecutarse cuando se registra un usuario con referido
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'increment_referral_count';

-- 3. CREAR FUNCIÓN PARA REGISTRAR REFERIDO (si no existe)
CREATE OR REPLACE FUNCTION register_referral(
    p_referrer_id UUID,
    p_referred_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
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
    SET referral_count = COALESCE(referral_count, 0) + 1
    WHERE id = p_referrer_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 4. VERIFICAR ESTRUCTURA DE user_referrals
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_referrals'
ORDER BY ordinal_position;

-- 5. VERIFICAR POLÍTICAS RLS (Row Level Security)
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('user_referrals', 'affiliate_commissions', 'affiliate_payments');

-- 6. CREAR POLÍTICAS RLS SI NO EXISTEN
-- Permitir a usuarios ver sus propios referidos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_referrals' 
        AND policyname = 'Users can view own referrals'
    ) THEN
        CREATE POLICY "Users can view own referrals" ON user_referrals
            FOR SELECT USING (auth.uid() = referrer_user_id);
    END IF;
END $$;

-- 7. VERIFICAR QUE EL TRIGGER ESTÁ ACTIVO
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'increment_referral_on_user_create';

-- 8. PRUEBA DE VERIFICACIÓN - Simular un registro con referido
-- NOTA: Esto es solo para verificar, no ejecutar en producción
/*
-- Ejemplo de cómo debería funcionar:
-- 1. Usuario A (referrer) ya existe con ID: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- 2. Usuario B se registra con link de A
-- 3. Al crear Usuario B con referred_by = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- 4. Debería ejecutarse:
   SELECT register_referral(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, -- referrer
       'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid  -- nuevo usuario
   );
*/

-- 9. VERIFICAR QUE TODO ESTÁ LISTO
SELECT 
    'affiliate_tiers' as componente,
    CASE WHEN COUNT(*) > 0 THEN '✅ Configurado' ELSE '❌ Falta configurar' END as estado
FROM affiliate_tiers
UNION ALL
SELECT 
    'increment_referral_count function',
    CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ No existe' END
FROM pg_proc WHERE proname = 'increment_referral_count'
UNION ALL
SELECT 
    'register_referral function',
    CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ No existe' END
FROM pg_proc WHERE proname = 'register_referral'
UNION ALL
SELECT 
    'user_referrals table',
    CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ No existe' END
FROM information_schema.tables WHERE table_name = 'user_referrals'
UNION ALL
SELECT 
    'RLS policies',
    CASE WHEN COUNT(*) > 0 THEN '✅ Configuradas' ELSE '⚠️ Sin políticas' END
FROM pg_policies WHERE tablename = 'user_referrals';

-- 10. INFORMACIÓN IMPORTANTE PARA EL FRONTEND
SELECT 
    '🔔 IMPORTANTE: El frontend debe llamar a register_referral() cuando referred_by no es null' as nota;