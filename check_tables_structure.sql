-- =====================================================
-- VER ESTRUCTURA EXACTA DE CADA TABLA
-- =====================================================

-- 1. Estructura de user_referrals
SELECT 'user_referrals' as tabla;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_referrals' 
ORDER BY ordinal_position;

-- 2. Estructura de affiliate_tiers
SELECT 'affiliate_tiers' as tabla;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'affiliate_tiers' 
ORDER BY ordinal_position;

-- 3. Estructura de affiliate_commissions
SELECT 'affiliate_commissions' as tabla;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'affiliate_commissions' 
ORDER BY ordinal_position;

-- 4. Estructura de affiliate_payments
SELECT 'affiliate_payments' as tabla;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'affiliate_payments' 
ORDER BY ordinal_position;

-- 5. Estructura de commission_history
SELECT 'commission_history' as tabla;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'commission_history' 
ORDER BY ordinal_position;

-- 6. Ver datos de affiliate_tiers (configuración de niveles)
SELECT * FROM affiliate_tiers ORDER BY tier_level;

-- 7. Contar registros en cada tabla
SELECT 
    'user_referrals' as tabla, COUNT(*) as total 
FROM user_referrals
UNION ALL
SELECT 
    'affiliate_commissions', COUNT(*) 
FROM affiliate_commissions
UNION ALL
SELECT 
    'affiliate_payments', COUNT(*) 
FROM affiliate_payments
UNION ALL
SELECT 
    'commission_history', COUNT(*) 
FROM commission_history;

-- 8. Ver algunos registros de user_referrals
SELECT * FROM user_referrals LIMIT 5;

-- 9. Ver algunos registros de affiliate_commissions
SELECT * FROM affiliate_commissions LIMIT 5;

-- 10. Ver usuarios con más referidos
SELECT 
    id,
    email,
    username,
    referral_count
FROM users
WHERE referral_count > 0
ORDER BY referral_count DESC
LIMIT 5;