-- Script simple para eliminar usuario de Supabase
-- Este script usa conversión dinámica de tipos para evitar errores

BEGIN;

DO $$
DECLARE
    email_to_delete VARCHAR := 'leonagustp@gmail.com';
    user_id_to_delete UUID;
    user_id_str TEXT;
BEGIN
    -- Obtener el ID del usuario
    SELECT id INTO user_id_to_delete 
    FROM auth.users 
    WHERE email = email_to_delete;
    
    IF user_id_to_delete IS NULL THEN
        RAISE NOTICE 'Usuario no encontrado';
        RETURN;
    END IF;
    
    -- Convertir a texto
    user_id_str := user_id_to_delete::TEXT;
    
    RAISE NOTICE 'Eliminando usuario: % (ID: %)', email_to_delete, user_id_str;
    
    -- Eliminar de todas las tablas relacionadas usando COALESCE para manejar ambos tipos
    -- Esto compara convirtiendo todo a texto
    
    -- Eliminar datos relacionados con broker_accounts
    DELETE FROM public.account_balance_history 
    WHERE account_id IN (
        SELECT id FROM public.broker_accounts 
        WHERE COALESCE(user_id::text, user_id) = user_id_str
    );
    
    DELETE FROM public.account_daily_metrics 
    WHERE account_id IN (
        SELECT id FROM public.broker_accounts 
        WHERE COALESCE(user_id::text, user_id) = user_id_str
    );
    
    DELETE FROM public.broker_transactions 
    WHERE account_id IN (
        SELECT id FROM public.broker_accounts 
        WHERE COALESCE(user_id::text, user_id) = user_id_str
    );
    
    DELETE FROM public.broker_account_changes 
    WHERE account_id IN (
        SELECT id FROM public.broker_accounts 
        WHERE COALESCE(user_id::text, user_id) = user_id_str
    );
    
    -- Eliminar broker_accounts
    DELETE FROM public.broker_accounts 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    -- Eliminar otras tablas usando comparación genérica
    DELETE FROM public.withdrawal_limits 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.transactions 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.withdrawals 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.deposits 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.internal_transfers 
    WHERE COALESCE(sender_user_id::text, sender_user_id) = user_id_str 
       OR COALESCE(receiver_user_id::text, receiver_user_id) = user_id_str;
    
    DELETE FROM public.payment_methods 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.kyc_documents 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.kyc_verifications 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.notifications 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.user_preferences 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.user_sessions 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.user_2fa 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.two_factor_attempts 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.email_2fa_codes 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.email_verification_attempts 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.copy_relationships 
    WHERE COALESCE(follower_id::text, follower_id) = user_id_str 
       OR COALESCE(master_trader_id::text, master_trader_id) = user_id_str;
    
    DELETE FROM public.copy_stats 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.master_traders 
    WHERE COALESCE(user_id::text, user_id) = user_id_str;
    
    DELETE FROM public.pamm_investments 
    WHERE COALESCE(investor_id::text, investor_id) = user_id_str;
    
    DELETE FROM public.pamm_funds 
    WHERE COALESCE(manager_id::text, manager_id) = user_id_str;
    
    DELETE FROM public.user_referrals 
    WHERE referrer_user_id = user_id_to_delete 
       OR referred_user_id = user_id_to_delete;
    
    DELETE FROM public.affiliate_payments 
    WHERE user_id = user_id_to_delete;
    
    -- Eliminar perfil y usuario
    DELETE FROM public.profiles WHERE id = user_id_to_delete;
    DELETE FROM public.users WHERE id = user_id_to_delete;
    
    -- Finalmente, eliminar de auth.users
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    
    RAISE NOTICE '✅ Usuario eliminado completamente';
    
END $$;

COMMIT;

-- Para verificar:
-- SELECT * FROM auth.users WHERE email = 'leonagustp@gmail.com';