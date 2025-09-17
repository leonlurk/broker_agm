-- =====================================================
-- VERIFICACIÓN COMPLETA DEL SISTEMA DE AFILIADOS
-- Ejecutar en el proyecto correcto de broker_agm
-- =====================================================

-- 1. VERIFICAR ESTRUCTURA DE TABLAS PRINCIPALES
SELECT 
    '🏗️ TABLAS PRINCIPALES' as seccion,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_referrals', 'affiliate_payments', 'commission_history', 'affiliate_tiers', 'Trade', 'TradingAccount')
ORDER BY table_name;

-- 2. VERIFICAR COLUMNAS DE LA TABLA PROFILES
SELECT 
    '👤 ESTRUCTURA PROFILES' as seccion,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('id', 'email', 'username', 'referral_count', 'metadata', 'created_at')
ORDER BY ordinal_position;

-- 3. VERIFICAR SI EXISTE LA TABLA USER_REFERRALS
SELECT 
    '📊 ESTRUCTURA USER_REFERRALS' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_referrals' AND table_schema = 'public')
        THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as tabla_existe;

-- 4. SI EXISTE, VER SU ESTRUCTURA
SELECT 
    '📋 COLUMNAS USER_REFERRALS' as seccion,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_referrals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. VERIFICAR TRIGGERS EXISTENTES
SELECT 
    '⚡ TRIGGERS' as seccion,
    tgname as trigger_name,
    tgenabled as enabled,
    tgfoid::regproc as function_name,
    relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE tgname LIKE '%referral%' OR tgname LIKE '%affiliate%'
ORDER BY tgname;

-- 6. VERIFICAR FUNCIONES RELACIONADAS CON AFILIADOS
SELECT 
    '🔧 FUNCIONES' as seccion,
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname LIKE '%referral%' OR proname LIKE '%affiliate%'
ORDER BY proname;

-- 7. CONTAR USUARIOS EXISTENTES
SELECT 
    '👥 USUARIOS TOTALES' as seccion,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN metadata->>'referred_by' IS NOT NULL THEN 1 END) as usuarios_con_referidor,
    COUNT(CASE WHEN referral_count > 0 THEN 1 END) as usuarios_con_referidos
FROM profiles;

-- 8. VER USUARIOS RECIENTES (ÚLTIMAS 24 HORAS)
SELECT 
    '🕐 USUARIOS RECIENTES' as seccion,
    id,
    email,
    username,
    metadata->>'referred_by' as referrer_id,
    referral_count,
    created_at
FROM profiles 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 9. VERIFICAR REGISTROS EN USER_REFERRALS (SI EXISTE)
SELECT 
    '📈 REGISTROS REFERRALS' as seccion,
    COUNT(*) as total_registros
FROM user_referrals
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_referrals' AND table_schema = 'public');

-- 10. VER CONTENIDO DE USER_REFERRALS (SI EXISTE Y TIENE DATOS)
SELECT 
    '📋 CONTENIDO REFERRALS' as seccion,
    ur.id,
    ur.referrer_user_id,
    ur.referred_user_id,
    ur.commission_earned,
    ur.created_at,
    p1.email as referrer_email,
    p2.email as referred_email
FROM user_referrals ur
LEFT JOIN profiles p1 ON ur.referrer_user_id = p1.id
LEFT JOIN profiles p2 ON ur.referred_user_id = p2.id
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_referrals' AND table_schema = 'public')
ORDER BY ur.created_at DESC
LIMIT 10;

-- 11. VERIFICAR USUARIO REFERIDOR PRINCIPAL
SELECT 
    '🎯 USUARIO REFERIDOR' as seccion,
    id,
    email,
    username,
    referral_count,
    metadata,
    created_at
FROM profiles 
WHERE email = 'tytfacundoomar@gmail.com';

-- 12. VERIFICAR ESTRUCTURA DE TRADING (PARA COMISIONES)
SELECT 
    '💰 TABLAS TRADING' as seccion,
    table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public')
        THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as existe
FROM (VALUES ('Trade'), ('TradingAccount'), ('Order'), ('Position')) AS t(table_name);

-- 13. RESUMEN FINAL DEL ESTADO
SELECT 
    '📊 RESUMEN ESTADO SISTEMA' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_referrals' AND table_schema = 'public')
        THEN 'SISTEMA INSTALADO'
        ELSE 'SISTEMA NO INSTALADO'
    END as estado_sistema,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname LIKE '%referral%')
        THEN 'TRIGGERS INSTALADOS'
        ELSE 'TRIGGERS NO INSTALADOS'
    END as estado_triggers,
    (SELECT COUNT(*) FROM profiles WHERE metadata->>'referred_by' IS NOT NULL) as usuarios_referidos_metadata,
    COALESCE((SELECT COUNT(*) FROM user_referrals WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_referrals' AND table_schema = 'public')), 0) as registros_referrals;
