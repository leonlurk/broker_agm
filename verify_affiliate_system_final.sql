-- =====================================================
-- VERIFICACIÓN FINAL DEL SISTEMA DE AFILIADOS
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
    '=== FUNCIÓN INCREMENT_REFERRAL ===' as info;

SELECT 
    CASE WHEN COUNT(*) > 0 THEN '✅ Función existe' 
         ELSE '❌ Función no existe' END as "Estado"
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
    ur.commission_earned as "Comisiones Totales",
    ur.created_at as "Fecha Registro"
FROM user_referrals ur
LEFT JOIN users u1 ON ur.referrer_user_id = u1.id
LEFT JOIN users u2 ON ur.referred_user_id = u2.id
ORDER BY ur.created_at DESC
LIMIT 5;

-- 5. Ver comisiones por trades (estructura real)
SELECT 
    '=== ÚLTIMAS COMISIONES POR TRADES ===' as info;

SELECT 
    ac.id,
    ur.referrer_user_id as "ID Afiliado",
    ac.account_number as "Cuenta",
    ac.instrument as "Instrumento",
    ac.trade_volume as "Volumen",
    ac.commission_rate as "Tasa",
    ac.commission_amount as "Comisión",
    ac.account_type as "Tipo Cuenta",
    ac.created_at as "Fecha"
FROM affiliate_commissions ac
LEFT JOIN user_referrals ur ON ac.referral_id = ur.id
ORDER BY ac.created_at DESC
LIMIT 5;

-- 6. Estadísticas generales
SELECT 
    '=== ESTADÍSTICAS GENERALES ===' as info;

WITH stats AS (
    SELECT 
        (SELECT COUNT(*) FROM affiliate_tiers) as niveles_configurados,
        (SELECT COUNT(*) FROM users WHERE referral_count > 0) as afiliados_con_referidos,
        (SELECT COUNT(*) FROM user_referrals) as total_relaciones_referidos,
        (SELECT COALESCE(SUM(commission_earned), 0) FROM user_referrals) as total_comisiones_generadas,
        (SELECT COUNT(*) FROM affiliate_commissions) as total_trades_comisionados
)
SELECT 
    niveles_configurados as "Niveles",
    afiliados_con_referidos as "Afiliados Activos",
    total_relaciones_referidos as "Total Referidos",
    total_comisiones_generadas as "Comisiones Totales",
    total_trades_comisionados as "Trades con Comisión"
FROM stats;

-- 7. ESTADO DEL SISTEMA
SELECT 
    '=====================================' as separador;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM affiliate_tiers) = 3 THEN
            '🟢 SISTEMA COMPLETAMENTE CONFIGURADO Y LISTO'
        WHEN (SELECT COUNT(*) FROM affiliate_tiers) > 0 THEN
            '🟡 SISTEMA PARCIALMENTE CONFIGURADO'
        ELSE
            '🔴 SISTEMA NO CONFIGURADO'
    END as "ESTADO FINAL";

-- 8. CÓMO FUNCIONA EL SISTEMA
SELECT 
    '=====================================' as separador;

SELECT '📋 FLUJO DEL SISTEMA:' as titulo;
SELECT '1. Usuario se registra con link de referido (?ref=USER_ID)' as paso_1;
SELECT '2. Sistema guarda relación en user_referrals' as paso_2;
SELECT '3. Incrementa referral_count del afiliado' as paso_3;
SELECT '4. Cuando referido hace trades, se calcula comisión' as paso_4;
SELECT '5. Comisión se registra en affiliate_commissions' as paso_5;
SELECT '6. Se actualiza commission_earned en user_referrals' as paso_6;

-- 9. PRÓXIMOS PASOS
SELECT 
    '=====================================' as separador;

SELECT '🎯 PARA TESTEAR:' as titulo;
SELECT '• Ve a Dashboard → Afiliados' as paso_1;
SELECT '• Copia tu link de referido' as paso_2;
SELECT '• Registra nuevo usuario con ese link' as paso_3;
SELECT '• Verifica que referral_count aumentó' as paso_4;
SELECT '• Cuando el referido opere, se generarán comisiones' as paso_5;