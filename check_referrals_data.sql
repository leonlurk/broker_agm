-- =====================================================
-- VERIFICAR DATOS Y ESTRUCTURA DE REFERIDOS
-- =====================================================

-- 1. Ver estructura de user_referrals
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'user_referrals'
ORDER BY 
    ordinal_position;

-- 2. Ver cuántos registros hay en user_referrals
SELECT COUNT(*) as total_registros FROM user_referrals;

-- 3. Ver algunos ejemplos de user_referrals
SELECT * FROM user_referrals LIMIT 5;

-- 4. Ver usuarios que tienen referidos (desde la tabla users)
SELECT 
    id,
    email,
    username,
    referral_count,
    affiliate_tier,
    referred_by
FROM users
WHERE referral_count > 0
LIMIT 10;

-- 5. Ver usuarios que fueron referidos por alguien
SELECT 
    u1.id,
    u1.email,
    u1.username,
    u1.referred_by,
    u2.email as referrer_email,
    u2.username as referrer_username,
    u2.referral_count as referrer_total_referrals
FROM users u1
LEFT JOIN users u2 ON u1.referred_by = u2.id
WHERE u1.referred_by IS NOT NULL
LIMIT 10;

-- 6. Ver el código de increment_referral_count
SELECT 
    proname,
    prosrc
FROM pg_proc
WHERE proname = 'increment_referral_count';

-- 7. Estadísticas generales de afiliados
SELECT 
    COUNT(*) FILTER (WHERE referred_by IS NOT NULL) as total_usuarios_referidos,
    COUNT(*) FILTER (WHERE referral_count > 0) as total_afiliados_con_referidos,
    COUNT(*) FILTER (WHERE affiliate_tier = 1) as tier_1_count,
    COUNT(*) FILTER (WHERE affiliate_tier = 2) as tier_2_count,
    COUNT(*) FILTER (WHERE affiliate_tier = 3) as tier_3_count,
    MAX(referral_count) as max_referidos_por_usuario,
    AVG(referral_count) FILTER (WHERE referral_count > 0) as promedio_referidos
FROM users;

-- 8. Top 5 afiliados con más referidos
SELECT 
    id,
    email,
    username,
    referral_count,
    affiliate_tier
FROM users
WHERE referral_count > 0
ORDER BY referral_count DESC
LIMIT 5;

-- 9. Verificar si hay tablas de comisiones
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%commission%';

-- 10. Ver si affiliate_payments existe y tiene datos
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_payments')
        THEN (SELECT COUNT(*) FROM affiliate_payments)
        ELSE -1
    END as affiliate_payments_count;