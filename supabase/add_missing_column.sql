-- =====================================================
-- AGREGAR COLUMNA FALTANTE: total_commissions_earned
-- =====================================================
-- Esta columna es importante para mantener el historial total de comisiones ganadas

-- 1. Agregar la columna si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'total_commissions_earned'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN total_commissions_earned DECIMAL(12,2) DEFAULT 0.00;
        
        RAISE NOTICE '✅ Columna total_commissions_earned agregada exitosamente';
    ELSE
        RAISE NOTICE '⚠️ La columna total_commissions_earned ya existe';
    END IF;
END $$;

-- 2. Actualizar la columna con datos existentes (si hay comisiones históricas)
UPDATE public.profiles p
SET total_commissions_earned = COALESCE(
    (
        SELECT SUM(ur.commission_earned)
        FROM public.user_referrals ur
        WHERE ur.referrer_user_id = p.id
    ), 
    0
)
WHERE p.id IN (
    SELECT DISTINCT referrer_user_id 
    FROM public.user_referrals
);

-- 3. Verificar que la columna se agregó correctamente
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN (
    'referred_by',
    'referral_count', 
    'affiliate_tier',
    'commission_balance',
    'total_commissions_earned'  -- Esta es la nueva
)
ORDER BY column_name;

-- 4. Ver resumen de columnas de afiliados
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RESUMEN DE COLUMNAS DE AFILIADOS EN PROFILES ===';
    
    -- Verificar cada columna
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'referred_by';
    RAISE NOTICE '✅ referred_by: %', CASE WHEN v_count > 0 THEN 'Existe' ELSE '❌ NO existe' END;
    
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'referral_count';
    RAISE NOTICE '✅ referral_count: %', CASE WHEN v_count > 0 THEN 'Existe' ELSE '❌ NO existe' END;
    
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'affiliate_tier';
    RAISE NOTICE '✅ affiliate_tier: %', CASE WHEN v_count > 0 THEN 'Existe' ELSE '❌ NO existe' END;
    
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'commission_balance';
    RAISE NOTICE '✅ commission_balance: %', CASE WHEN v_count > 0 THEN 'Existe' ELSE '❌ NO existe' END;
    
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'total_commissions_earned';
    RAISE NOTICE '✅ total_commissions_earned: %', CASE WHEN v_count > 0 THEN 'Existe' ELSE '❌ NO existe' END;
    
    RAISE NOTICE '=============================================';
END $$;