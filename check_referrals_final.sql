-- =====================================================
-- VERIFICAR DATOS Y ESTRUCTURA DE REFERIDOS (CORREGIDO)
-- =====================================================

-- 1. Ver TODOS los campos de la tabla users
SELECT 
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
ORDER BY 
    ordinal_position;

-- 2. Ver estructura de user_referrals
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

-- 3. Ver cuántos registros hay en user_referrals
SELECT COUNT(*) as total_registros FROM user_referrals;

-- 4. Ver algunos ejemplos de user_referrals
SELECT * FROM user_referrals LIMIT 5;

-- 5. Ver usuarios que tienen referidos (desde la tabla users)
SELECT 
    id,
    email,
    username,
    referral_count,
    referred_by
FROM users
WHERE referral_count > 0
LIMIT 10;

-- 6. Ver usuarios que fueron referidos por alguien
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

-- 7. Ver el código de increment_referral_count
SELECT 
    proname,
    prosrc
FROM pg_proc
WHERE proname = 'increment_referral_count';

-- 8. Estadísticas generales de afiliados
SELECT 
    COUNT(*) FILTER (WHERE referred_by IS NOT NULL) as total_usuarios_referidos,
    COUNT(*) FILTER (WHERE referral_count > 0) as total_afiliados_con_referidos,
    MAX(referral_count) as max_referidos_por_usuario,
    AVG(referral_count) FILTER (WHERE referral_count > 0) as promedio_referidos
FROM users;

-- 9. Top 5 afiliados con más referidos
SELECT 
    id,
    email,
    username,
    referral_count
FROM users
WHERE referral_count > 0
ORDER BY referral_count DESC
LIMIT 5;

-- 10. Verificar todas las tablas relacionadas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND (
    tablename LIKE '%affil%'
    OR tablename LIKE '%referr%'
    OR tablename LIKE '%commission%'
)
ORDER BY tablename;

-- 11. Ver relación entre user_referrals y users
SELECT 
    ur.id,
    ur.referrer_user_id,
    u1.email as referrer_email,
    ur.referred_user_id,
    u2.email as referred_email,
    ur.status,
    ur.commission_earned,
    ur.created_at
FROM user_referrals ur
LEFT JOIN users u1 ON ur.referrer_user_id = u1.id
LEFT JOIN users u2 ON ur.referred_user_id = u2.id
ORDER BY ur.created_at DESC
LIMIT 10;