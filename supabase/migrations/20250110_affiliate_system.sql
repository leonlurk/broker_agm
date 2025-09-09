-- =====================================================
-- SISTEMA COMPLETO DE AFILIADOS PARA AGM BROKER
-- =====================================================
-- Fecha: 2025-01-10
-- Descripción: Implementa el sistema completo de afiliados con tracking de referrals y comisiones

-- 1. CREAR TABLA DE REFERRALS (si no existe)
-- Registra la relación entre quien refiere y quien fue referido
CREATE TABLE IF NOT EXISTS public.user_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
    commission_earned DECIMAL(12,2) DEFAULT 0.00,
    total_lots_traded DECIMAL(12,4) DEFAULT 0.0000,
    last_commission_date TIMESTAMPTZ,
    tier_at_registration INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Asegurar que un usuario solo puede ser referido una vez
    CONSTRAINT unique_referred_user UNIQUE(referred_user_id),
    -- Evitar auto-referencia
    CONSTRAINT no_self_referral CHECK (referrer_user_id != referred_user_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON public.user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON public.user_referrals(status);

-- 2. CREAR TABLA DE PAGOS DE AFILIADOS
-- Registra todos los pagos de comisiones a afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(50),
    payment_details JSONB, -- Detalles adicionales del pago (wallet address, bank info, etc)
    transaction_id VARCHAR(255),
    commission_period_start DATE,
    commission_period_end DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES public.profiles(id),
    
    -- Índice único para evitar pagos duplicados
    CONSTRAINT unique_transaction UNIQUE(transaction_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_user ON public.affiliate_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_status ON public.affiliate_payments(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_created ON public.affiliate_payments(created_at DESC);

-- 3. CREAR TABLA DE HISTORIAL DE COMISIONES
-- Registra cada comisión generada por operación
CREATE TABLE IF NOT EXISTS public.commission_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES public.user_referrals(id) ON DELETE CASCADE,
    trade_id VARCHAR(255), -- ID de la operación en MT4/MT5
    account_number VARCHAR(50),
    account_type VARCHAR(50), -- 'Market Direct' o 'Institucional'
    symbol VARCHAR(20), -- Par o instrumento operado
    lots DECIMAL(12,4) NOT NULL,
    commission_per_lot DECIMAL(10,2) NOT NULL,
    total_commission DECIMAL(12,2) NOT NULL,
    tier_level INTEGER NOT NULL,
    is_eligible BOOLEAN DEFAULT true, -- Si el instrumento es elegible según tipo de cuenta
    trade_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Evitar duplicados de la misma operación
    CONSTRAINT unique_trade UNIQUE(trade_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_commission_history_referral ON public.commission_history(referral_id);
CREATE INDEX IF NOT EXISTS idx_commission_history_trade_date ON public.commission_history(trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_commission_history_account ON public.commission_history(account_number);

-- 4. CREAR TABLA DE CONFIGURACIÓN DE TIERS
-- Define los niveles y sus beneficios
CREATE TABLE IF NOT EXISTS public.affiliate_tiers (
    tier_level INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    min_referrals INTEGER NOT NULL,
    commission_market_direct DECIMAL(10,2) NOT NULL, -- Comisión por lote Market Direct
    commission_institutional DECIMAL(10,2) NOT NULL, -- Comisión por lote Institucional
    min_payout DECIMAL(10,2) DEFAULT 50.00,
    benefits JSONB, -- Beneficios adicionales del tier
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración de tiers (si no existe)
INSERT INTO public.affiliate_tiers (tier_level, name, min_referrals, commission_market_direct, commission_institutional, min_payout, benefits)
VALUES 
    (1, 'Tier 1', 0, 3.00, 1.50, 50.00, '{"bonuses": []}'),
    (2, 'Tier 2', 100, 3.50, 1.75, 25.00, '{"bonuses": ["priority_support"]}'),
    (3, 'Tier 3', 200, 4.00, 2.00, 10.00, '{"bonuses": ["priority_support", "exclusive_materials"]}')
ON CONFLICT (tier_level) DO NOTHING;

-- 5. AGREGAR COLUMNAS A PROFILES (si no existen)
-- Agregar campos de afiliado al perfil del usuario
DO $$ 
BEGIN
    -- Columna para tracking de referrals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'referral_count') THEN
        ALTER TABLE public.profiles ADD COLUMN referral_count INTEGER DEFAULT 0;
    END IF;
    
    -- Columna para tier actual
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'affiliate_tier') THEN
        ALTER TABLE public.profiles ADD COLUMN affiliate_tier INTEGER DEFAULT 1;
    END IF;
    
    -- Columna para balance de comisiones
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'commission_balance') THEN
        ALTER TABLE public.profiles ADD COLUMN commission_balance DECIMAL(12,2) DEFAULT 0.00;
    END IF;
    
    -- Columna para total de comisiones históricas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'total_commissions_earned') THEN
        ALTER TABLE public.profiles ADD COLUMN total_commissions_earned DECIMAL(12,2) DEFAULT 0.00;
    END IF;
END $$;

-- 6. FUNCIÓN PARA CREAR REFERRAL AL REGISTRARSE
CREATE OR REPLACE FUNCTION create_referral_on_signup()
RETURNS TRIGGER AS $$
DECLARE
    referrer_tier INTEGER;
BEGIN
    -- Si el nuevo usuario tiene un referred_by
    IF NEW.referred_by IS NOT NULL THEN
        -- Obtener el tier actual del referrer
        SELECT affiliate_tier INTO referrer_tier
        FROM public.profiles
        WHERE id = NEW.referred_by;
        
        -- Crear el registro de referral
        INSERT INTO public.user_referrals (
            referrer_user_id,
            referred_user_id,
            status,
            tier_at_registration
        ) VALUES (
            NEW.referred_by,
            NEW.id,
            'pending', -- Comienza como pending hasta que sea verificado
            COALESCE(referrer_tier, 1)
        );
        
        -- Incrementar el contador de referrals del referrer
        UPDATE public.profiles
        SET referral_count = referral_count + 1
        WHERE id = NEW.referred_by;
        
        -- Actualizar el tier del referrer si corresponde
        PERFORM update_user_tier(NEW.referred_by);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNCIÓN PARA ACTUALIZAR TIER DE USUARIO
CREATE OR REPLACE FUNCTION update_user_tier(user_id UUID)
RETURNS VOID AS $$
DECLARE
    ref_count INTEGER;
    new_tier INTEGER;
BEGIN
    -- Obtener cantidad de referrals activos
    SELECT COUNT(*) INTO ref_count
    FROM public.user_referrals
    WHERE referrer_user_id = user_id
    AND status = 'active';
    
    -- Determinar nuevo tier
    SELECT tier_level INTO new_tier
    FROM public.affiliate_tiers
    WHERE min_referrals <= ref_count
    ORDER BY tier_level DESC
    LIMIT 1;
    
    -- Actualizar tier del usuario
    UPDATE public.profiles
    SET affiliate_tier = COALESCE(new_tier, 1)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNCIÓN PARA CALCULAR COMISIÓN
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
    -- Verificar elegibilidad según tipo de cuenta
    IF p_account_type = 'Market Direct' THEN
        -- Market Direct: todos los instrumentos son elegibles
        is_eligible := TRUE;
    ELSIF p_account_type = 'Institucional' THEN
        -- Institucional: solo Forex y Metales
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
    
    -- Si no es elegible, retornar 0
    IF NOT is_eligible THEN
        RETURN 0;
    END IF;
    
    -- Obtener monto de comisión según tier y tipo de cuenta
    IF p_account_type = 'Market Direct' THEN
        SELECT commission_market_direct INTO commission_amount
        FROM public.affiliate_tiers
        WHERE tier_level = p_tier;
    ELSE
        SELECT commission_institutional INTO commission_amount
        FROM public.affiliate_tiers
        WHERE tier_level = p_tier;
    END IF;
    
    -- Calcular comisión total
    RETURN p_lots * COALESCE(commission_amount, 0);
END;
$$ LANGUAGE plpgsql;

-- 9. FUNCIÓN PARA PROCESAR COMISIÓN DE TRADE
CREATE OR REPLACE FUNCTION process_trade_commission(
    p_trade_id VARCHAR,
    p_account_number VARCHAR,
    p_account_type VARCHAR,
    p_symbol VARCHAR,
    p_lots DECIMAL,
    p_trade_date TIMESTAMPTZ
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_referral_id UUID;
    v_referrer_id UUID;
    v_tier INTEGER;
    v_commission DECIMAL;
    v_is_eligible BOOLEAN;
BEGIN
    -- Buscar el usuario dueño de la cuenta
    SELECT user_id INTO v_user_id
    FROM public.trading_accounts
    WHERE account_number = p_account_number;
    
    -- Si no se encuentra, salir
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Buscar si este usuario fue referido
    SELECT id, referrer_user_id INTO v_referral_id, v_referrer_id
    FROM public.user_referrals
    WHERE referred_user_id = v_user_id
    AND status = 'active';
    
    -- Si no fue referido, salir
    IF v_referral_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Obtener tier del referrer
    SELECT affiliate_tier INTO v_tier
    FROM public.profiles
    WHERE id = v_referrer_id;
    
    -- Calcular comisión
    v_commission := calculate_commission(p_lots, v_tier, p_account_type, p_symbol);
    v_is_eligible := (v_commission > 0);
    
    -- Insertar en historial de comisiones
    INSERT INTO public.commission_history (
        referral_id,
        trade_id,
        account_number,
        account_type,
        symbol,
        lots,
        commission_per_lot,
        total_commission,
        tier_level,
        is_eligible,
        trade_date
    ) VALUES (
        v_referral_id,
        p_trade_id,
        p_account_number,
        p_account_type,
        p_symbol,
        p_lots,
        CASE WHEN p_lots > 0 THEN v_commission / p_lots ELSE 0 END,
        v_commission,
        v_tier,
        v_is_eligible,
        p_trade_date
    ) ON CONFLICT (trade_id) DO NOTHING;
    
    -- Si se insertó la comisión, actualizar balances
    IF FOUND AND v_commission > 0 THEN
        -- Actualizar el referral
        UPDATE public.user_referrals
        SET 
            commission_earned = commission_earned + v_commission,
            total_lots_traded = total_lots_traded + p_lots,
            last_commission_date = p_trade_date,
            updated_at = NOW()
        WHERE id = v_referral_id;
        
        -- Actualizar balance del referrer
        UPDATE public.profiles
        SET 
            commission_balance = commission_balance + v_commission,
            total_commissions_earned = total_commissions_earned + v_commission
        WHERE id = v_referrer_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 10. CREAR TRIGGER PARA REFERRALS EN SIGNUP
DROP TRIGGER IF EXISTS create_referral_on_user_signup ON public.profiles;
CREATE TRIGGER create_referral_on_user_signup
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_referral_on_signup();

-- 11. CREAR VISTA PARA DASHBOARD DE AFILIADOS
CREATE OR REPLACE VIEW public.affiliate_dashboard AS
SELECT 
    p.id as user_id,
    p.username,
    p.email,
    p.referral_count,
    p.affiliate_tier,
    p.commission_balance,
    p.total_commissions_earned,
    t.name as tier_name,
    t.commission_market_direct,
    t.commission_institutional,
    t.min_payout,
    (
        SELECT COUNT(*) 
        FROM public.user_referrals 
        WHERE referrer_user_id = p.id 
        AND status = 'active'
    ) as active_referrals,
    (
        SELECT COUNT(*) 
        FROM public.user_referrals 
        WHERE referrer_user_id = p.id 
        AND status = 'pending'
    ) as pending_referrals,
    (
        SELECT SUM(total_lots_traded) 
        FROM public.user_referrals 
        WHERE referrer_user_id = p.id
    ) as total_lots_from_referrals
FROM public.profiles p
LEFT JOIN public.affiliate_tiers t ON p.affiliate_tier = t.tier_level;

-- 12. POLÍTICAS DE SEGURIDAD (RLS)
-- Habilitar RLS en las tablas
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_history ENABLE ROW LEVEL SECURITY;

-- Políticas para user_referrals
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
    FOR SELECT USING (
        auth.uid() = referrer_user_id OR 
        auth.uid() = referred_user_id
    );

-- Políticas para affiliate_payments
CREATE POLICY "Users can view their own payments" ON public.affiliate_payments
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas para commission_history
CREATE POLICY "Users can view their own commission history" ON public.commission_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_referrals
            WHERE id = commission_history.referral_id
            AND referrer_user_id = auth.uid()
        )
    );

-- 13. FUNCIÓN PARA WEBHOOK DE MT4/MT5
-- Esta función será llamada por el webhook cuando lleguen datos de trading
CREATE OR REPLACE FUNCTION webhook_process_trade(
    payload JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Procesar el trade
    PERFORM process_trade_commission(
        payload->>'trade_id',
        payload->>'account_number',
        payload->>'account_type',
        payload->>'symbol',
        (payload->>'lots')::DECIMAL,
        (payload->>'trade_date')::TIMESTAMPTZ
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Trade processed successfully'
    );
    
    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    v_result := jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

-- Para verificar que todo se creó correctamente:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_referrals', 'affiliate_payments', 'commission_history', 'affiliate_tiers');