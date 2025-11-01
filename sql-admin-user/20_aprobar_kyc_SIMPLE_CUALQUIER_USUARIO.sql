-- ================================================
-- APROBAR KYC - SIMPLE (CUALQUIER USUARIO)
-- ================================================
-- Versión simple que solo actualiza profiles
-- sin tocar kyc_verifications
-- ================================================

-- ⚠️ CAMBIAR EL EMAIL en las 3 ubicaciones marcadas

-- Aprobar KYC
UPDATE profiles
SET
    kyc_status = 'approved',
    kyc_verified = true,
    updated_at = NOW()
WHERE email = 'usuario@example.com'  -- ✅ CAMBIAR AQUÍ
RETURNING
    id,
    email,
    username,
    kyc_status,
    kyc_verified,
    updated_at;

-- Verificar
SELECT
    '✅ VERIFICACIÓN' as resultado,
    email,
    username,
    role,
    kyc_status as "debe ser approved",
    kyc_verified as "debe ser true"
FROM profiles
WHERE email = 'usuario@example.com';  -- ✅ CAMBIAR AQUÍ
