-- =====================================================
-- COMPLETAR CONFIGURACIÓN DE NIVELES DE AFILIADOS
-- =====================================================

-- La tabla ya tiene Tier 1, agregar Tier 2 y Tier 3

-- Tier 2: Silver (100-199 referidos)
INSERT INTO affiliate_tiers (
    tier_level,
    name,
    min_referrals,
    commission_market_direct,
    commission_institutional,
    min_payout,
    benefits,
    created_at,
    updated_at
) VALUES (
    2,
    'Tier 2',
    100,
    3.50, -- $3.50 USD por lote Market Direct
    1.75, -- $1.75 USD por lote Institucional
    25.00, -- Pago mínimo $25
    '{"bonuses": ["priority_support"]}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (tier_level) DO UPDATE SET
    name = EXCLUDED.name,
    min_referrals = EXCLUDED.min_referrals,
    commission_market_direct = EXCLUDED.commission_market_direct,
    commission_institutional = EXCLUDED.commission_institutional,
    min_payout = EXCLUDED.min_payout,
    benefits = EXCLUDED.benefits,
    updated_at = NOW();

-- Tier 3: Gold (200+ referidos)
INSERT INTO affiliate_tiers (
    tier_level,
    name,
    min_referrals,
    commission_market_direct,
    commission_institutional,
    min_payout,
    benefits,
    created_at,
    updated_at
) VALUES (
    3,
    'Tier 3',
    200,
    4.00, -- $4.00 USD por lote Market Direct
    2.00, -- $2.00 USD por lote Institucional
    10.00, -- Pago mínimo $10
    '{"bonuses": ["priority_support", "exclusive_materials", "vip_events"]}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (tier_level) DO UPDATE SET
    name = EXCLUDED.name,
    min_referrals = EXCLUDED.min_referrals,
    commission_market_direct = EXCLUDED.commission_market_direct,
    commission_institutional = EXCLUDED.commission_institutional,
    min_payout = EXCLUDED.min_payout,
    benefits = EXCLUDED.benefits,
    updated_at = NOW();

-- Verificar que los 3 niveles estén configurados
SELECT 
    tier_level,
    name,
    min_referrals as "Mínimo Referidos",
    '$' || commission_market_direct || ' USD' as "Comisión Market Direct",
    '$' || commission_institutional || ' USD' as "Comisión Institucional",
    '$' || min_payout || ' USD' as "Pago Mínimo",
    benefits->'bonuses' as "Beneficios"
FROM affiliate_tiers
ORDER BY tier_level;

-- Mensaje de confirmación
SELECT '✅ Niveles de afiliados configurados correctamente' as mensaje;