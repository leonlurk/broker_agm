-- =====================================================
-- VERIFICAR ESTRUCTURA COMPLETA DE AFILIADOS (CORREGIDO)
-- =====================================================

-- 1. Ver TODAS las columnas de la tabla user_referrals
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'user_referrals'
ORDER BY 
    ordinal_position;

-- 2. Ver TODAS las columnas de la tabla users (para entender su estructura)
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
ORDER BY 
    ordinal_position;

-- 3. Ver TODAS las columnas de la tabla affiliate_payments (si existe)
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'affiliate_payments'
ORDER BY 
    ordinal_position;

-- 4. Ver el código de la función increment_referral_count()
SELECT 
    routine_name,
    routine_definition
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public'
    AND routine_name = 'increment_referral_count';

-- 5. Ver algunos registros de ejemplo de user_referrals (si hay datos)
SELECT * FROM user_referrals LIMIT 5;

-- 6. Contar cuántos referidos hay en total
SELECT 
    COUNT(*) as total_referrals,
    COUNT(DISTINCT referrer_user_id) as total_referrers,
    COUNT(DISTINCT referred_user_id) as total_referred
FROM user_referrals;

-- 7. Ver si hay usuarios con referidos (buscando en user_referrals)
SELECT 
    ur.referrer_user_id,
    u1.email as referrer_email,
    u1.username as referrer_username,
    COUNT(ur.referred_user_id) as total_referidos,
    SUM(ur.commission_earned) as total_comisiones
FROM user_referrals ur
LEFT JOIN users u1 ON ur.referrer_user_id = u1.id
GROUP BY ur.referrer_user_id, u1.email, u1.username
LIMIT 10;

-- 8. Ver todas las tablas que existen relacionadas con afiliados
SELECT 
    tablename
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
    AND (
        tablename LIKE '%referr%' 
        OR tablename LIKE '%affil%'
        OR tablename LIKE '%commission%'
    )
ORDER BY 
    tablename;

-- 9. Ver políticas RLS de user_referrals
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
    AND tablename = 'user_referrals';

-- 10. Ver índices de user_referrals
SELECT 
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
    AND tablename = 'user_referrals';

-- 11. Verificar si las relaciones entre usuarios y referidos están funcionando
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

-- 12. Ver si la tabla users tiene algún campo relacionado con referidos
SELECT 
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
    AND (
        column_name LIKE '%refer%'
        OR column_name LIKE '%affil%'
        OR column_name LIKE '%meta%'
    );

-- 13. Verificar estructura de profiles (si existe)
SELECT 
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'profiles'
    AND (
        column_name LIKE '%refer%'
        OR column_name LIKE '%affil%'
    );