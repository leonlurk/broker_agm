-- ================================================
-- RECHAZAR KYC - TEMPLATE
-- ================================================
-- Este script rechaza el KYC de un usuario
-- con una razón de rechazo
-- ================================================

-- ⚠️ ANTES DE EJECUTAR:
-- 1. Reemplaza 'usuario@example.com' con el email (3 veces)
-- 2. Reemplaza 'Razón del rechazo aquí' con la razón real
-- ================================================

-- Paso 1: Actualizar campos KYC en profiles
UPDATE profiles
SET
    kyc_status = 'rejected',
    kyc_verified = false,
    updated_at = NOW()
WHERE email = 'usuario@example.com'  -- ✅ CAMBIAR AQUÍ
RETURNING id, email, username, kyc_status, kyc_verified;

-- Paso 2: Actualizar registro en kyc_verifications con razón
UPDATE kyc_verifications
SET
    status = 'rejected',
    rejection_reason = 'Razón del rechazo aquí',  -- ✅ CAMBIAR RAZÓN
    reviewed_at = NOW(),
    updated_at = NOW()
WHERE user_id = (
    SELECT id::text FROM profiles WHERE email = 'usuario@example.com'  -- ✅ CAMBIAR AQUÍ
)
RETURNING id, email, status, rejection_reason, reviewed_at;

-- ================================================
-- VERIFICACIÓN
-- ================================================
SELECT
    '❌ VERIFICACIÓN KYC RECHAZADO' as resultado,
    p.id,
    p.email,
    p.username,
    p.kyc_status as "debe ser rejected",
    p.kyc_verified as "debe ser false",
    k.status as "status_kyc_table",
    k.rejection_reason as "Razón de rechazo",
    k.reviewed_at
FROM profiles p
LEFT JOIN kyc_verifications k ON k.user_id = p.id::text
WHERE p.email = 'usuario@example.com';  -- ✅ CAMBIAR AQUÍ
