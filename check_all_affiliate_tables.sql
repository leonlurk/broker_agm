-- =====================================================
-- ANALIZAR TODAS LAS TABLAS DE AFILIADOS
-- =====================================================

-- 1. ESTRUCTURA DE user_referrals
SELECT '=== TABLA: user_referrals ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_referrals' 
ORDER BY ordinal_position;

-- Datos de ejemplo
SELECT * FROM user_referrals LIMIT 3;

-- 2. ESTRUCTURA DE affiliate_commissions
SELECT '=== TABLA: affiliate_commissions ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'affiliate_commissions' 
ORDER BY ordinal_position;

-- Datos de ejemplo
SELECT * FROM affiliate_commissions LIMIT 3;

-- 3. ESTRUCTURA DE affiliate_payments
SELECT '=== TABLA: affiliate_payments ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'affiliate_payments' 
ORDER BY ordinal_position;

-- Datos de ejemplo
SELECT * FROM affiliate_payments LIMIT 3;

-- 4. ESTRUCTURA DE affiliate_tiers
SELECT '=== TABLA: affiliate_tiers ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'affiliate_tiers' 
ORDER BY ordinal_position;

-- Datos de ejemplo
SELECT * FROM affiliate_tiers LIMIT 5;

-- 5. ESTRUCTURA DE commission_history
SELECT '=== TABLA: commission_history ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'commission_history' 
ORDER BY ordinal_position;

-- Datos de ejemplo
SELECT * FROM commission_history LIMIT 3;

-- 6. ESTADÍSTICAS GENERALES
SELECT 
    'user_referrals' as tabla, COUNT(*) as total_registros 
FROM user_referrals
UNION ALL
SELECT 
    'affiliate_commissions' as tabla, COUNT(*) as total_registros 
FROM affiliate_commissions
UNION ALL
SELECT 
    'affiliate_payments' as tabla, COUNT(*) as total_registros 
FROM affiliate_payments
UNION ALL
SELECT 
    'affiliate_tiers' as tabla, COUNT(*) as total_registros 
FROM affiliate_tiers
UNION ALL
SELECT 
    'commission_history' as tabla, COUNT(*) as total_registros 
FROM commission_history;

-- 7. Ver usuarios con referidos activos
SELECT 
    u.id,
    u.email,
    u.username,
    u.referral_count,
    COUNT(ur.referred_user_id) as referidos_en_tabla,
    SUM(ur.commission_earned) as total_comisiones
FROM users u
LEFT JOIN user_referrals ur ON u.id = ur.referrer_user_id
WHERE u.referral_count > 0 OR ur.referrer_user_id IS NOT NULL
GROUP BY u.id, u.email, u.username, u.referral_count
LIMIT 10;

-- 8. Ver el tier actual de los usuarios
SELECT 
    u.id,
    u.email,
    u.referral_count,
    at.tier_level,
    at.min_referrals,
    at.commission_rate_market_direct,
    at.commission_rate_institutional
FROM users u
CROSS JOIN affiliate_tiers at
WHERE u.referral_count >= at.min_referrals
AND u.referral_count > 0
ORDER BY u.referral_count DESC, at.tier_level DESC
LIMIT 10;