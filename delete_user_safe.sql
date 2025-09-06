-- =========================================
-- SCRIPT SEGURO PARA ELIMINAR USUARIO COMPLETO DE SUPABASE
-- =========================================
-- Este script elimina un usuario y TODOS sus datos relacionados
-- de manera segura usando una transacción
-- 
-- IMPORTANTE: 
-- 1. Reemplaza el email en la línea 19 con el email del usuario a eliminar
-- 2. Este script usa una transacción - si algo falla, nada se elimina
-- 3. Puedes hacer ROLLBACK en lugar de COMMIT para cancelar
-- =========================================

-- Inicia la transacción
BEGIN;

-- Variable con el email del usuario a eliminar
DO $$
DECLARE
    email_to_delete VARCHAR := 'leonagustp@gmail.com';  -- <-- CAMBIA ESTE EMAIL
    user_id_to_delete UUID;
    user_id_as_text TEXT;
    deleted_count INTEGER := 0;
BEGIN
    -- Obtener el ID del usuario
    SELECT id INTO user_id_to_delete 
    FROM auth.users 
    WHERE email = email_to_delete;
    
    -- Verificar si el usuario existe
    IF user_id_to_delete IS NULL THEN
        RAISE NOTICE 'Usuario con email % no encontrado', email_to_delete;
        RETURN;
    END IF;
    
    -- Convertir UUID a TEXT para tablas que lo requieren
    user_id_as_text := user_id_to_delete::TEXT;
    
    RAISE NOTICE 'Eliminando datos del usuario: % (ID: %)', email_to_delete, user_id_to_delete;
    
    -- =========================================
    -- ELIMINAR DATOS RELACIONADOS (en orden por foreign keys)
    -- =========================================
    
    -- 1. Eliminar límites de retiro
    DELETE FROM public.withdrawal_limits WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados límites de retiro: %', deleted_count;
    END IF;
    
    -- 2. Eliminar historiales de balance (broker_accounts usa TEXT)
    DELETE FROM public.account_balance_history 
    WHERE account_id IN (SELECT id FROM public.broker_accounts WHERE user_id = user_id_as_text);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados registros de historial de balance: %', deleted_count;
    END IF;
    
    -- 3. Eliminar métricas diarias (broker_accounts usa TEXT)
    DELETE FROM public.account_daily_metrics 
    WHERE account_id IN (SELECT id FROM public.broker_accounts WHERE user_id = user_id_as_text);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas métricas diarias: %', deleted_count;
    END IF;
    
    -- 4. Eliminar transacciones de broker (broker_accounts usa TEXT)
    DELETE FROM public.broker_transactions 
    WHERE account_id IN (SELECT id FROM public.broker_accounts WHERE user_id = user_id_as_text);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas transacciones de broker: %', deleted_count;
    END IF;
    
    -- 5. Eliminar cambios de cuenta (broker_accounts usa TEXT)
    DELETE FROM public.broker_account_changes 
    WHERE account_id IN (SELECT id FROM public.broker_accounts WHERE user_id = user_id_as_text);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados cambios de cuenta: %', deleted_count;
    END IF;
    
    -- 6. Eliminar cuentas de broker (user_id es TEXT)
    DELETE FROM public.broker_accounts WHERE user_id = user_id_as_text;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas cuentas de broker: %', deleted_count;
    END IF;
    
    -- 7. Eliminar transacciones financieras (intentar ambos tipos)
    BEGIN
        DELETE FROM public.transactions WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.transactions WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas transacciones: %', deleted_count;
    END IF;
    
    -- 8. Eliminar retiros (intentar ambos tipos)
    BEGIN
        DELETE FROM public.withdrawals WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.withdrawals WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados retiros: %', deleted_count;
    END IF;
    
    -- 9. Eliminar depósitos (intentar ambos tipos)
    BEGIN
        DELETE FROM public.deposits WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.deposits WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados depósitos: %', deleted_count;
    END IF;
    
    -- 10. Eliminar transferencias internas (intentar ambos tipos)
    BEGIN
        DELETE FROM public.internal_transfers 
        WHERE sender_user_id = user_id_to_delete OR receiver_user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.internal_transfers 
        WHERE sender_user_id = user_id_as_text OR receiver_user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas transferencias internas: %', deleted_count;
    END IF;
    
    -- 11. Eliminar métodos de pago (intentar ambos tipos)
    BEGIN
        DELETE FROM public.payment_methods WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.payment_methods WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados métodos de pago: %', deleted_count;
    END IF;
    
    -- 12. Eliminar documentos KYC (intentar ambos tipos)
    BEGIN
        DELETE FROM public.kyc_documents WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.kyc_documents WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados documentos KYC: %', deleted_count;
    END IF;
    
    -- 13. Eliminar verificaciones KYC (intentar ambos tipos)
    BEGIN
        DELETE FROM public.kyc_verifications WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.kyc_verifications WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas verificaciones KYC: %', deleted_count;
    END IF;
    
    -- 14. Eliminar notificaciones (intentar ambos tipos)
    BEGIN
        DELETE FROM public.notifications WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.notifications WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas notificaciones: %', deleted_count;
    END IF;
    
    -- 15. Eliminar preferencias de usuario (intentar ambos tipos)
    BEGIN
        DELETE FROM public.user_preferences WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.user_preferences WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas preferencias de usuario: %', deleted_count;
    END IF;
    
    -- 16. Eliminar sesiones (intentar ambos tipos)
    BEGIN
        DELETE FROM public.user_sessions WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.user_sessions WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas sesiones: %', deleted_count;
    END IF;
    
    -- 17. Eliminar 2FA (intentar ambos tipos)
    BEGIN
        DELETE FROM public.user_2fa WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.user_2fa WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminada configuración 2FA: %', deleted_count;
    END IF;
    
    -- 18. Eliminar intentos de 2FA (intentar ambos tipos)
    BEGIN
        DELETE FROM public.two_factor_attempts WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.two_factor_attempts WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados intentos de 2FA: %', deleted_count;
    END IF;
    
    -- 19. Eliminar códigos de verificación de email (intentar ambos tipos)
    BEGIN
        DELETE FROM public.email_2fa_codes WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.email_2fa_codes WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados códigos de verificación de email: %', deleted_count;
    END IF;
    
    -- 20. Eliminar intentos de verificación de email (intentar ambos tipos)
    BEGIN
        DELETE FROM public.email_verification_attempts WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.email_verification_attempts WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados intentos de verificación: %', deleted_count;
    END IF;
    
    -- 21. Eliminar relaciones de copy trading (como seguidor) - intentar ambos tipos
    BEGIN
        DELETE FROM public.copy_relationships WHERE follower_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.copy_relationships WHERE follower_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas relaciones de copy trading (seguidor): %', deleted_count;
    END IF;
    
    -- 22. Eliminar relaciones de copy trading (como trader) - intentar ambos tipos
    BEGIN
        DELETE FROM public.copy_relationships WHERE master_trader_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.copy_relationships WHERE master_trader_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas relaciones de copy trading (trader): %', deleted_count;
    END IF;
    
    -- 23. Eliminar estadísticas de copy (intentar ambos tipos)
    BEGIN
        DELETE FROM public.copy_stats WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.copy_stats WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas estadísticas de copy trading: %', deleted_count;
    END IF;
    
    -- 24. Eliminar como master trader (intentar ambos tipos)
    BEGIN
        DELETE FROM public.master_traders WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.master_traders WHERE user_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminado como master trader: %', deleted_count;
    END IF;
    
    -- 25. Eliminar inversiones PAMM (intentar ambos tipos)
    BEGIN
        DELETE FROM public.pamm_investments WHERE investor_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.pamm_investments WHERE investor_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminadas inversiones PAMM: %', deleted_count;
    END IF;
    
    -- 26. Eliminar fondos PAMM (como gestor) - intentar ambos tipos
    BEGIN
        DELETE FROM public.pamm_funds WHERE manager_id = user_id_to_delete;
    EXCEPTION WHEN OTHERS THEN
        DELETE FROM public.pamm_funds WHERE manager_id = user_id_as_text;
    END;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados fondos PAMM: %', deleted_count;
    END IF;
    
    -- 27. Eliminar referidos de afiliados (como referidor)
    DELETE FROM public.user_referrals WHERE referrer_user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados referidos: %', deleted_count;
    END IF;
    
    -- 28. Eliminar referidos de afiliados (como referido)
    DELETE FROM public.user_referrals WHERE referred_user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminada relación de referido: %', deleted_count;
    END IF;
    
    -- 29. Eliminar pagos de afiliados
    DELETE FROM public.affiliate_payments WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminados pagos de afiliados: %', deleted_count;
    END IF;
    
    -- 30. Eliminar perfil (profiles)
    DELETE FROM public.profiles WHERE id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminado perfil: %', deleted_count;
    END IF;
    
    -- 31. Eliminar de la tabla users
    DELETE FROM public.users WHERE id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminado de tabla users: %', deleted_count;
    END IF;
    
    -- 32. Finalmente, eliminar de auth.users
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '  ✓ Eliminado de auth.users: %', deleted_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Usuario % eliminado completamente', email_to_delete;
    RAISE NOTICE 'ID: %', user_id_to_delete;
    
END $$;

-- =========================================
-- IMPORTANTE: Revisa los mensajes antes de confirmar
-- =========================================
-- Si todo se ve bien, descomenta la siguiente línea:
COMMIT;

-- Si algo salió mal o quieres cancelar, usa:
-- ROLLBACK;

-- =========================================
-- VERIFICACIÓN POST-ELIMINACIÓN
-- =========================================
-- Puedes ejecutar estas consultas para verificar que todo se eliminó:
/*
SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'leonagustp@gmail.com') as "Usuario en auth.users";
SELECT EXISTS(SELECT 1 FROM public.users WHERE id = 'dfe5c068-bddf-419d-b816-08303dd276ea') as "Usuario en public.users";
SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = 'dfe5c068-bddf-419d-b816-08303dd276ea') as "Perfil existe";
SELECT COUNT(*) FROM public.broker_accounts WHERE user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea'::text as "Cuentas broker restantes";
*/