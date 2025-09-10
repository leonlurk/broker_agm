-- =====================================================
-- TEST COMPLETO DEL FLUJO DE REFERIDOS
-- =====================================================

-- 1. Ver los 3 niveles configurados
SELECT 
    '=== NIVELES DE AFILIADOS CONFIGURADOS ===' as info;

SELECT 
    tier_level,
    name,
    min_referrals as "Min Referidos",
    commission_market_direct as "Com. Market Direct",
    commission_institutional as "Com. Institucional",
    min_payout as "Pago Mínimo"
FROM affiliate_tiers
ORDER BY tier_level;

-- 2. Verificar función increment_referral_count
SELECT 
    '=== VERIFICANDO FUNCIÓN INCREMENT_REFERRAL ===' as info;

SELECT 
    proname as "Función",
    CASE WHEN prosrc LIKE '%referral_count%' THEN '✅ Actualiza referral_count' 
         ELSE '❌ No actualiza referral_count' END as "Estado"
FROM pg_proc 
WHERE proname = 'increment_referral_count';

-- 3. Ver usuarios que ya tienen referidos
SELECT 
    '=== TOP 5 AFILIADOS ACTUALES ===' as info;

SELECT 
    id,
    email,
    username,
    referral_count as "Total Referidos",
    CASE 
        WHEN referral_count = 0 THEN 'Sin referidos'
        WHEN referral_count < 100 THEN 'Tier 1 (0-99)'
        WHEN referral_count < 200 THEN 'Tier 2 (100-199)'
        ELSE 'Tier 3 (200+)'
    END as "Nivel Actual"
FROM users
WHERE referral_count > 0
ORDER BY referral_count DESC
LIMIT 5;

-- 4. Ver relaciones de referidos existentes
SELECT 
    '=== ÚLTIMOS 5 REFERIDOS REGISTRADOS ===' as info;

SELECT 
    ur.id,
    u1.email as "Afiliado",
    u2.email as "Referido",
    ur.status as "Estado",
    ur.commission_earned as "Comisiones Generadas",
    ur.created_at as "Fecha Registro"
FROM user_referrals ur
LEFT JOIN users u1 ON ur.referrer_user_id = u1.id
LEFT JOIN users u2 ON ur.referred_user_id = u2.id
ORDER BY ur.created_at DESC
LIMIT 5;

-- 5. Verificar si hay comisiones pendientes
SELECT 
    '=== COMISIONES PENDIENTES ===' as info;

SELECT 
    COUNT(*) as "Total Comisiones",
    SUM(commission_amount) as "Monto Total Pendiente",
    COUNT(DISTINCT affiliate_id) as "Afiliados con Comisiones"
FROM affiliate_commissions
WHERE status = 'pending';

-- 6. INSTRUCCIONES PARA TESTEAR
SELECT 
    '=====================================' as separador;

SELECT '🎯 SISTEMA LISTO PARA TESTEAR' as estado;

SELECT 
    '📋 PASOS PARA PROBAR:' as titulo
UNION ALL
SELECT '1️⃣ En el frontend, ir a Dashboard > Afiliados'
UNION ALL
SELECT '2️⃣ Copiar tu link de referido personal'
UNION ALL
SELECT '3️⃣ Abrir ventana incógnito y registrar nuevo usuario con ese link'
UNION ALL
SELECT '4️⃣ Verificar que referral_count aumentó en tu perfil'
UNION ALL
SELECT '5️⃣ Revisar en Dashboard de Afiliados tus estadísticas';

-- 7. Query para verificar después de registrar un referido
SELECT 
    '=====================================' as separador;

SELECT 
    '🔍 DESPUÉS DE REGISTRAR UN REFERIDO, EJECUTAR:' as nota;

-- Este query muestra el último referido registrado
WITH ultimo_referido AS (
    SELECT * FROM user_referrals 
    ORDER BY created_at DESC 
    LIMIT 1
)
SELECT 
    'SELECT * FROM user_referrals ORDER BY created_at DESC LIMIT 1;' as "Query para verificar";