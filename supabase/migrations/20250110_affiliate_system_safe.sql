-- =====================================================
-- SISTEMA DE AFILIADOS - VERSIÓN SEGURA
-- =====================================================
-- Este script verifica qué existe antes de crear para evitar errores

-- PRIMERO: Verificar qué ya existe
DO $$ 
DECLARE
    has_user_referrals BOOLEAN;
    has_affiliate_payments BOOLEAN;
    has_referred_by_column BOOLEAN;
BEGIN
    -- Verificar si existe tabla user_referrals
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_referrals'
    ) INTO has_user_referrals;
    
    -- Verificar si existe tabla affiliate_payments
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'affiliate_payments'
    ) INTO has_affiliate_payments;
    
    -- Verificar si profiles tiene columna referred_by
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'referred_by'
    ) INTO has_referred_by_column;
    
    RAISE NOTICE 'Estado actual:';
    RAISE NOTICE '- Tabla user_referrals existe: %', has_user_referrals;
    RAISE NOTICE '- Tabla affiliate_payments existe: %', has_affiliate_payments;
    RAISE NOTICE '- Columna referred_by existe: %', has_referred_by_column;
END $$;

-- =====================================================
-- 1. CREAR TABLA user_referrals (SOLO SI NO EXISTE)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL,
    referred_user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
    commission_earned DECIMAL(12,2) DEFAULT 0.00,
    total_lots_traded DECIMAL(12,4) DEFAULT 0.0000,
    last_commission_date TIMESTAMPTZ,
    tier_at_registration INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_referred_user UNIQUE(referred_user_id),
    CONSTRAINT no_self_referral CHECK (referrer_user_id != referred_user_id)
);

-- Añadir foreign keys solo si la tabla se acaba de crear
DO $$ 
BEGIN
    -- Verificar si las foreign keys ya existen antes de crearlas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_referrals_referrer_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_referrals 
        ADD CONSTRAINT user_referrals_referrer_user_id_fkey 
        FOREIGN KEY (referrer_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_referrals_referred_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_referrals 
        ADD CONSTRAINT user_referrals_referred_user_id_fkey 
        FOREIGN KEY (referred_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON public.user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON public.user_referrals(status);

-- =====================================================
-- 2. CREAR TABLA affiliate_payments (SOLO SI NO EXISTE)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.affiliate_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(50),
    payment_details JSONB,
    transaction_id VARCHAR(255),
    commission_period_start DATE,
    commission_period_end DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES public.profiles(id),
    
    CONSTRAINT unique_transaction UNIQUE(transaction_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_user ON public.affiliate_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_status ON public.affiliate_payments(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_created ON public.affiliate_payments(created_at DESC);

-- =====================================================
-- 3. CREAR TABLA commission_history (SOLO SI NO EXISTE)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.commission_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES public.user_referrals(id) ON DELETE CASCADE,
    trade_id VARCHAR(255),
    account_number VARCHAR(50),
    account_type VARCHAR(50),
    symbol VARCHAR(20),
    lots DECIMAL(12,4) NOT NULL,
    commission_per_lot DECIMAL(10,2) NOT NULL,
    total_commission DECIMAL(12,2) NOT NULL,
    tier_level INTEGER NOT NULL,
    is_eligible BOOLEAN DEFAULT true,
    trade_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_trade UNIQUE(trade_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_commission_history_referral ON public.commission_history(referral_id);
CREATE INDEX IF NOT EXISTS idx_commission_history_trade_date ON public.commission_history(trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_commission_history_account ON public.commission_history(account_number);

-- =====================================================
-- 4. CREAR/ACTUALIZAR TABLA affiliate_tiers
-- =====================================================
CREATE TABLE IF NOT EXISTS public.affiliate_tiers (
    tier_level INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    min_referrals INTEGER NOT NULL,
    commission_market_direct DECIMAL(10,2) NOT NULL,
    commission_institutional DECIMAL(10,2) NOT NULL,
    min_payout DECIMAL(10,2) DEFAULT 50.00,
    benefits JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar o actualizar configuración de tiers
INSERT INTO public.affiliate_tiers (tier_level, name, min_referrals, commission_market_direct, commission_institutional, min_payout, benefits)
VALUES 
    (1, 'Tier 1', 0, 3.00, 1.50, 50.00, '{"bonuses": []}'),
    (2, 'Tier 2', 100, 3.50, 1.75, 25.00, '{"bonuses": ["priority_support"]}'),
    (3, 'Tier 3', 200, 4.00, 2.00, 10.00, '{"bonuses": ["priority_support", "exclusive_materials"]}')
ON CONFLICT (tier_level) 
DO UPDATE SET 
    commission_market_direct = EXCLUDED.commission_market_direct,
    commission_institutional = EXCLUDED.commission_institutional,
    min_payout = EXCLUDED.min_payout,
    benefits = EXCLUDED.benefits,
    updated_at = NOW();

-- =====================================================
-- 5. AGREGAR COLUMNAS FALTANTES A profiles
-- =====================================================
DO $$ 
BEGIN
    -- referral_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'referral_count') THEN
        ALTER TABLE public.profiles ADD COLUMN referral_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna referral_count agregada a profiles';
    END IF;
    
    -- affiliate_tier
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'affiliate_tier') THEN
        ALTER TABLE public.profiles ADD COLUMN affiliate_tier INTEGER DEFAULT 1;
        RAISE NOTICE 'Columna affiliate_tier agregada a profiles';
    END IF;
    
    -- commission_balance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'commission_balance') THEN
        ALTER TABLE public.profiles ADD COLUMN commission_balance DECIMAL(12,2) DEFAULT 0.00;
        RAISE NOTICE 'Columna commission_balance agregada a profiles';
    END IF;
    
    -- total_commissions_earned
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'total_commissions_earned') THEN
        ALTER TABLE public.profiles ADD COLUMN total_commissions_earned DECIMAL(12,2) DEFAULT 0.00;
        RAISE NOTICE 'Columna total_commissions_earned agregada a profiles';
    END IF;
    
    -- referred_by (si no existe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'referred_by') THEN
        ALTER TABLE public.profiles ADD COLUMN referred_by UUID REFERENCES public.profiles(id);
        RAISE NOTICE 'Columna referred_by agregada a profiles';
    END IF;
END $$;

-- =====================================================
-- 6. CREAR O REEMPLAZAR FUNCIÓN MEJORADA increment_referral_count
-- =====================================================
CREATE OR REPLACE FUNCTION increment_referral_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el nuevo usuario tiene un referrer
    IF NEW.referred_by IS NOT NULL THEN
        -- Incrementar contador en profiles
        UPDATE public.profiles 
        SET referral_count = COALESCE(referral_count, 0) + 1
        WHERE id = NEW.referred_by;
        
        -- Crear registro en user_referrals si no existe
        INSERT INTO public.user_referrals (
            referrer_user_id,
            referred_user_id,
            status,
            tier_at_registration
        ) 
        SELECT 
            NEW.referred_by,
            NEW.id,
            'pending',
            COALESCE(p.affiliate_tier, 1)
        FROM public.profiles p
        WHERE p.id = NEW.referred_by
        ON CONFLICT (referred_user_id) DO NOTHING;
        
        -- Actualizar tier del referrer
        PERFORM update_user_tier(NEW.referred_by);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FUNCIÓN PARA ACTUALIZAR TIER
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_tier(user_id UUID)
RETURNS VOID AS $$
DECLARE
    ref_count INTEGER;
    new_tier INTEGER;
BEGIN
    -- Contar referrals activos
    SELECT COUNT(*) INTO ref_count
    FROM public.user_referrals
    WHERE referrer_user_id = user_id
    AND status = 'active';
    
    -- Determinar tier
    SELECT tier_level INTO new_tier
    FROM public.affiliate_tiers
    WHERE min_referrals <= ref_count
    ORDER BY tier_level DESC
    LIMIT 1;
    
    -- Actualizar
    UPDATE public.profiles
    SET affiliate_tier = COALESCE(new_tier, 1)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FUNCIÓN PARA CALCULAR COMISIÓN
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_commission(
    p_lots DECIMAL,
    p_tier INTEGER,
    p_account_type VARCHAR,
    p_symbol VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
    commission_amount DECIMAL;
    is_eligible BOOLEAN;
BEGIN
    -- Verificar elegibilidad
    IF p_account_type = 'Market Direct' THEN
        is_eligible := TRUE;
    ELSIF p_account_type = 'Institucional' THEN
        -- Solo Forex y Metales para Institucional
        is_eligible := (
            p_symbol ILIKE '%EUR%' OR p_symbol ILIKE '%USD%' OR 
            p_symbol ILIKE '%GBP%' OR p_symbol ILIKE '%JPY%' OR
            p_symbol ILIKE '%AUD%' OR p_symbol ILIKE '%CAD%' OR
            p_symbol ILIKE '%CHF%' OR p_symbol ILIKE '%NZD%' OR
            p_symbol ILIKE '%GOLD%' OR p_symbol ILIKE '%SILVER%' OR
            p_symbol ILIKE '%XAU%' OR p_symbol ILIKE '%XAG%'
        );
    ELSE
        is_eligible := FALSE;
    END IF;
    
    IF NOT is_eligible THEN
        RETURN 0;
    END IF;
    
    -- Obtener comisión según tier y tipo
    IF p_account_type = 'Market Direct' THEN
        SELECT commission_market_direct INTO commission_amount
        FROM public.affiliate_tiers
        WHERE tier_level = p_tier;
    ELSE
        SELECT commission_institutional INTO commission_amount
        FROM public.affiliate_tiers
        WHERE tier_level = p_tier;
    END IF;
    
    RETURN p_lots * COALESCE(commission_amount, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. RECREAR TRIGGER SI ES NECESARIO
-- =====================================================
DROP TRIGGER IF EXISTS increment_referral_count_trigger ON public.profiles;
CREATE TRIGGER increment_referral_count_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION increment_referral_count();

-- =====================================================
-- 10. HABILITAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_history ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
DROP POLICY IF EXISTS "Users can view own referrals" ON public.user_referrals;
CREATE POLICY "Users can view own referrals" ON public.user_referrals
    FOR SELECT USING (
        auth.uid() = referrer_user_id OR 
        auth.uid() = referred_user_id
    );

DROP POLICY IF EXISTS "Users can view own payments" ON public.affiliate_payments;
CREATE POLICY "Users can view own payments" ON public.affiliate_payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own commissions" ON public.commission_history;
CREATE POLICY "Users can view own commissions" ON public.commission_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_referrals
            WHERE id = commission_history.referral_id
            AND referrer_user_id = auth.uid()
        )
    );

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICACIÓN DE INSTALACIÓN ===';
    
    -- Verificar tablas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_referrals') THEN
        RAISE NOTICE '✅ Tabla user_referrals creada';
    ELSE
        RAISE NOTICE '❌ Tabla user_referrals NO creada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_payments') THEN
        RAISE NOTICE '✅ Tabla affiliate_payments creada';
    ELSE
        RAISE NOTICE '❌ Tabla affiliate_payments NO creada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commission_history') THEN
        RAISE NOTICE '✅ Tabla commission_history creada';
    ELSE
        RAISE NOTICE '❌ Tabla commission_history NO creada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_tiers') THEN
        RAISE NOTICE '✅ Tabla affiliate_tiers creada';
    ELSE
        RAISE NOTICE '❌ Tabla affiliate_tiers NO creada';
    END IF;
    
    -- Verificar columnas en profiles
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN
        RAISE NOTICE '✅ Columna referred_by existe en profiles';
    ELSE
        RAISE NOTICE '❌ Columna referred_by NO existe en profiles';
    END IF;
    
    RAISE NOTICE '=== FIN DE VERIFICACIÓN ===';
END $$;