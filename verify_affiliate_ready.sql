-- =====================================================
-- VERIFICAR SI EL SISTEMA ESTÁ LISTO PARA TESTEAR
-- =====================================================

-- 1. Verificar que los 3 tiers están configurados
SELECT 
    '1. NIVELES CONFIGURADOS' as verificacion,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) = 3 THEN '✅ OK - 3 niveles listos' 
         WHEN COUNT(*) = 1 THEN '⚠️ Solo Tier 1 configurado - ejecutar complete_affiliate_tiers.sql'
         ELSE '❌ Faltan niveles' END as estado
FROM affiliate_tiers;

-- 2. Ver detalle de los niveles
SELECT 
    tier_level,
    name,
    min_referrals as min_ref,
    commission_market_direct as com_market,
    commission_institutional as com_inst,
    min_payout
FROM affiliate_tiers
ORDER BY tier_level;

-- 3. Verificar función increment_referral_count
SELECT 
    '2. FUNCIÓN INCREMENT_REFERRAL' as verificacion,
    CASE WHEN COUNT(*) > 0 THEN '✅ Existe' ELSE '❌ No existe' END as estado
FROM pg_proc 
WHERE proname = 'increment_referral_count';

-- 4. Verificar si hay usuarios con referidos
SELECT 
    '3. USUARIOS CON REFERIDOS' as verificacion,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) > 0 THEN '✅ Hay ' || COUNT(*) || ' usuarios con referidos' 
         ELSE '⚠️ No hay usuarios con referidos aún' END as estado
FROM users 
WHERE referral_count > 0;

-- 5. Verificar registros en user_referrals
SELECT 
    '4. REGISTROS DE REFERIDOS' as verificacion,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) > 0 THEN '✅ Hay ' || COUNT(*) || ' relaciones registradas' 
         ELSE '⚠️ No hay referidos registrados aún' END as estado
FROM user_referrals;

-- 6. Verificar comisiones
SELECT 
    '5. COMISIONES GENERADAS' as verificacion,
    COUNT(*) as cantidad,
    CASE WHEN COUNT(*) > 0 THEN '✅ Hay ' || COUNT(*) || ' comisiones registradas' 
         ELSE '⚠️ No hay comisiones generadas aún' END as estado
FROM affiliate_commissions;

-- 7. RESUMEN FINAL
SELECT 
    '=====================================' as separador;
    
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM affiliate_tiers) >= 3 THEN
            '🟢 SISTEMA LISTO PARA TESTEAR'
        ELSE
            '🟡 SISTEMA PARCIALMENTE LISTO - Ejecutar complete_affiliate_tiers.sql primero'
    END as "ESTADO DEL SISTEMA";

-- 8. Instrucciones para testear
SELECT 
    '=====================================' as separador;
    
SELECT 
    'PARA TESTEAR:' as instrucciones,
    '1. Registrar un usuario nuevo (será afiliado)' as paso1,
    '2. Copiar su link de referido desde Dashboard Afiliados' as paso2,
    '3. Registrar otro usuario usando ese link' as paso3,
    '4. Verificar que referral_count aumentó' as paso4,
    '5. Verificar en user_referrals que se creó la relación' as paso5;