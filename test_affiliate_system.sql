-- =====================================================
-- SCRIPT DE PRUEBA DEL SISTEMA DE AFILIADOS
-- =====================================================

-- NOTA: Ejecutar DESPUÉS de setup_affiliate_complete.sql

-- 1. CREAR USUARIOS DE PRUEBA (si no existen)
DO $$
DECLARE
    v_affiliate_id UUID;
    v_referred1_id UUID;
    v_referred2_id UUID;
    v_commission_id UUID;
BEGIN
    -- Generar IDs
    v_affiliate_id := gen_random_uuid();
    v_referred1_id := gen_random_uuid();
    v_referred2_id := gen_random_uuid();
    
    -- Crear afiliado de prueba
    INSERT INTO users (id, email, username, referral_count, referred_by, created_at)
    VALUES (v_affiliate_id, 'affiliate@test.com', 'affiliate_test', 0, NULL, NOW())
    ON CONFLICT (email) DO NOTHING;
    
    -- Crear primer referido
    INSERT INTO users (id, email, username, referral_count, referred_by, created_at)
    VALUES (v_referred1_id, 'referred1@test.com', 'referred1_test', 0, v_affiliate_id, NOW())
    ON CONFLICT (email) DO NOTHING;
    
    -- Crear segundo referido
    INSERT INTO users (id, email, username, referral_count, referred_by, created_at)
    VALUES (v_referred2_id, 'referred2@test.com', 'referred2_test', 0, v_affiliate_id, NOW())
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Usuarios de prueba creados';
    RAISE NOTICE 'Affiliate ID: %', v_affiliate_id;
    RAISE NOTICE 'Referred 1 ID: %', v_referred1_id;
    RAISE NOTICE 'Referred 2 ID: %', v_referred2_id;
END $$;

-- 2. VERIFICAR QUE LOS REFERIDOS SE REGISTRARON
SELECT 
    '=== VERIFICACIÓN DE REFERIDOS REGISTRADOS ===' as info;

SELECT 
    u1.email as afiliado,
    u1.referral_count as total_referidos,
    u2.email as referido,
    ur.status,
    ur.created_at
FROM user_referrals ur
JOIN users u1 ON ur.referrer_user_id = u1.id
JOIN users u2 ON ur.referred_user_id = u2.id
WHERE u1.email = 'affiliate@test.com';

-- 3. VERIFICAR TIER DEL AFILIADO
SELECT 
    '=== TIER DEL AFILIADO DE PRUEBA ===' as info;

SELECT 
    u.email,
    u.referral_count,
    (SELECT * FROM get_user_tier(u.id)) as tier_info
FROM users u
WHERE u.email = 'affiliate@test.com';

-- 4. SIMULAR OPERACIONES Y GENERAR COMISIONES
DO $$
DECLARE
    v_affiliate_id UUID;
    v_referred_id UUID;
    v_commission_id UUID;
BEGIN
    -- Obtener IDs
    SELECT id INTO v_affiliate_id FROM users WHERE email = 'affiliate@test.com';
    SELECT id INTO v_referred_id FROM users WHERE email = 'referred1@test.com';
    
    -- Generar comisión por operación Market Direct (2 lotes)
    v_commission_id := generate_affiliate_commission(
        v_affiliate_id,
        v_referred_id,
        'market_direct',
        2.0,
        '{"account": "MT5-12345", "symbol": "EURUSD"}'::jsonb
    );
    
    RAISE NOTICE 'Comisión Market Direct generada: %', v_commission_id;
    
    -- Generar comisión por operación Institucional (5 lotes)
    v_commission_id := generate_affiliate_commission(
        v_affiliate_id,
        v_referred_id,
        'institutional',
        5.0,
        '{"account": "INST-67890", "symbol": "GBPUSD"}'::jsonb
    );
    
    RAISE NOTICE 'Comisión Institucional generada: %', v_commission_id;
END $$;

-- 5. VER COMISIONES GENERADAS
SELECT 
    '=== COMISIONES GENERADAS ===' as info;

SELECT 
    ac.id,
    u1.email as afiliado,
    u2.email as referido,
    ac.commission_type as tipo,
    ac.commission_amount as monto,
    ac.status,
    ac.tier_at_time as tier_cuando_genero,
    ac.created_at
FROM affiliate_commissions ac
JOIN users u1 ON ac.affiliate_id = u1.id
JOIN users u2 ON ac.referred_user_id = u2.id
ORDER BY ac.created_at DESC;

-- 6. VER TOTAL DE COMISIONES PENDIENTES
SELECT 
    '=== TOTAL COMISIONES PENDIENTES ===' as info;

SELECT 
    u.email,
    calculate_pending_commissions(u.id) as total_pendiente,
    (SELECT min_payout FROM get_user_tier(u.id)) as pago_minimo
FROM users u
WHERE u.email = 'affiliate@test.com';

-- 7. SIMULAR PAGO (si hay suficientes comisiones)
DO $$
DECLARE
    v_affiliate_id UUID;
    v_payment_id UUID;
    v_pending NUMERIC;
    v_min_payout NUMERIC;
BEGIN
    -- Obtener ID del afiliado
    SELECT id INTO v_affiliate_id FROM users WHERE email = 'affiliate@test.com';
    
    -- Verificar monto pendiente
    v_pending := calculate_pending_commissions(v_affiliate_id);
    SELECT min_payout INTO v_min_payout FROM get_user_tier(v_affiliate_id);
    
    IF v_pending >= v_min_payout THEN
        -- Procesar pago
        v_payment_id := process_affiliate_payment(
            v_affiliate_id,
            'bank_transfer',
            '{"bank": "Test Bank", "account": "1234567890"}'::jsonb
        );
        
        RAISE NOTICE 'Pago procesado: %', v_payment_id;
        RAISE NOTICE 'Monto: $%', v_pending;
    ELSE
        RAISE NOTICE 'No se puede procesar pago. Pendiente: $%, Mínimo: $%', v_pending, v_min_payout;
        RAISE NOTICE 'Generando más comisiones para alcanzar el mínimo...';
        
        -- Generar más comisiones para prueba
        PERFORM generate_affiliate_commission(
            v_affiliate_id,
            (SELECT id FROM users WHERE email = 'referred2@test.com'),
            'market_direct',
            20.0, -- 20 lotes para generar $60 en comisiones (tier 1)
            '{"account": "MT5-99999", "symbol": "USDJPY"}'::jsonb
        );
        
        RAISE NOTICE 'Comisiones adicionales generadas. Vuelve a ejecutar para procesar pago.';
    END IF;
END $$;

-- 8. VER PAGOS PROCESADOS
SELECT 
    '=== PAGOS PROCESADOS ===' as info;

SELECT 
    ap.id,
    u.email as afiliado,
    ap.amount as monto,
    ap.payment_method as metodo,
    ap.status,
    ap.created_at,
    ap.processed_at,
    array_length(ap.commission_ids, 1) as num_comisiones_incluidas
FROM affiliate_payments ap
JOIN users u ON ap.affiliate_id = u.id
ORDER BY ap.created_at DESC;

-- 9. RESUMEN FINAL DEL TEST
SELECT 
    '=== RESUMEN DEL TEST ===' as info;

WITH stats AS (
    SELECT 
        (SELECT COUNT(*) FROM users WHERE email LIKE '%@test.com') as usuarios_prueba,
        (SELECT COUNT(*) FROM user_referrals ur 
         JOIN users u ON ur.referrer_user_id = u.id 
         WHERE u.email = 'affiliate@test.com') as referidos_registrados,
        (SELECT COUNT(*) FROM affiliate_commissions ac 
         JOIN users u ON ac.affiliate_id = u.id 
         WHERE u.email = 'affiliate@test.com') as comisiones_generadas,
        (SELECT COUNT(*) FROM affiliate_payments ap 
         JOIN users u ON ap.affiliate_id = u.id 
         WHERE u.email = 'affiliate@test.com') as pagos_procesados
)
SELECT 
    'Usuarios de prueba creados' as metrica, usuarios_prueba as valor FROM stats
UNION ALL
SELECT 'Referidos registrados', referidos_registrados FROM stats
UNION ALL
SELECT 'Comisiones generadas', comisiones_generadas FROM stats
UNION ALL
SELECT 'Pagos procesados', pagos_procesados FROM stats;

-- 10. LIMPIAR DATOS DE PRUEBA (OPCIONAL - DESCOMENTAR PARA EJECUTAR)
/*
-- ADVERTENCIA: Esto eliminará TODOS los datos de prueba
DELETE FROM affiliate_payments WHERE affiliate_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
DELETE FROM affiliate_commissions WHERE affiliate_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
DELETE FROM user_referrals WHERE referrer_user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');
DELETE FROM users WHERE email LIKE '%@test.com';
*/

SELECT 
    '✅ TEST COMPLETADO' as resultado,
    'Revisa los resultados arriba para verificar el funcionamiento' as mensaje;