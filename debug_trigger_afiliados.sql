-- =====================================================
-- DEBUG DEL TRIGGER DE AFILIADOS
-- Ejecutar paso a paso para encontrar el problema
-- =====================================================

-- 1. Verificar que la función existe y su código
SELECT 
    '🔧 FUNCIÓN increment_referral_count' as seccion,
    proname as function_name,
    prosrc as function_code
FROM pg_proc 
WHERE proname = 'increment_referral_count';

-- 2. Verificar que el trigger existe y está activo
SELECT 
    '⚡ TRIGGER increment_referral_count_trigger' as seccion,
    tgname as trigger_name,
    tgenabled as enabled,
    tgtype as trigger_type,
    tgfoid::regproc as function_name,
    relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE tgname = 'increment_referral_count_trigger';

-- 3. Probar la función manualmente con datos reales
DO $$
DECLARE
    test_user_id UUID;
    referrer_id UUID;
    referrer_email TEXT := 'tytfacundoomar@gmail.com';
BEGIN
    -- Obtener el ID del referidor
    SELECT id INTO referrer_id FROM profiles WHERE email = referrer_email;
    
    IF referrer_id IS NULL THEN
        RAISE NOTICE 'ERROR: No se encontró el usuario referidor con email %', referrer_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Referidor encontrado: % (ID: %)', referrer_email, referrer_id;
    
    -- Obtener un usuario de prueba diferente
    SELECT id INTO test_user_id 
    FROM profiles 
    WHERE email != referrer_email 
    AND (metadata->>'referred_by') IS NULL
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: No se encontró usuario de prueba disponible';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Usuario de prueba: % (ID: %)', (SELECT email FROM profiles WHERE id = test_user_id), test_user_id;
    
    -- Verificar estado antes
    RAISE NOTICE 'Estado ANTES:';
    RAISE NOTICE '- Referral count del referidor: %', (SELECT referral_count FROM profiles WHERE id = referrer_id);
    RAISE NOTICE '- Registros en user_referrals: %', (SELECT COUNT(*) FROM user_referrals);
    
    -- Simular el trigger actualizando metadata
    UPDATE profiles 
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'), 
        '{referred_by}', 
        to_jsonb(referrer_id::text)
    )
    WHERE id = test_user_id;
    
    RAISE NOTICE 'Metadata actualizado para usuario %', test_user_id;
    
    -- Verificar estado después
    RAISE NOTICE 'Estado DESPUÉS:';
    RAISE NOTICE '- Referral count del referidor: %', (SELECT referral_count FROM profiles WHERE id = referrer_id);
    RAISE NOTICE '- Registros en user_referrals: %', (SELECT COUNT(*) FROM user_referrals);
    RAISE NOTICE '- Metadata del usuario de prueba: %', (SELECT metadata->>'referred_by' FROM profiles WHERE id = test_user_id);
    
END $$;

-- 4. Verificar si hay restricciones o políticas RLS que bloqueen
SELECT 
    '🔒 POLÍTICAS RLS user_referrals' as seccion,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_referrals';

-- 5. Verificar permisos en las tablas
SELECT 
    '👤 PERMISOS TABLAS' as seccion,
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('profiles', 'user_referrals')
AND grantee != 'postgres'
ORDER BY table_name, grantee;

-- 6. Probar inserción manual en user_referrals
DO $$
DECLARE
    test_user_id UUID;
    referrer_id UUID;
BEGIN
    -- Obtener IDs
    SELECT id INTO referrer_id FROM profiles WHERE email = 'tytfacundoomar@gmail.com';
    SELECT id INTO test_user_id FROM profiles WHERE email != 'tytfacundoomar@gmail.com' LIMIT 1;
    
    IF referrer_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Intentar inserción manual
        BEGIN
            INSERT INTO user_referrals (referrer_user_id, referred_user_id, commission_earned)
            VALUES (referrer_id, test_user_id, 0.00);
            
            RAISE NOTICE 'ÉXITO: Inserción manual en user_referrals exitosa';
            
            -- Actualizar referral_count manualmente
            UPDATE profiles 
            SET referral_count = referral_count + 1 
            WHERE id = referrer_id;
            
            RAISE NOTICE 'ÉXITO: Referral count actualizado manualmente';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR en inserción manual: %', SQLERRM;
        END;
    END IF;
END $$;

-- 7. Verificar resultado final
SELECT 
    '📊 RESULTADO FINAL' as seccion,
    (SELECT COUNT(*) FROM user_referrals) as registros_user_referrals,
    (SELECT referral_count FROM profiles WHERE email = 'tytfacundoomar@gmail.com') as referral_count_referidor;
