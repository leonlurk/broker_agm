-- ================================================
-- APROBAR KYC - VERSIÓN SIMPLE (SIN kyc_verifications)
-- ================================================
-- Este script aprueba el KYC solo en la tabla profiles
-- sin intentar crear registro en kyc_verifications
-- ================================================
-- Usuario: support@alphaglobalmarket.io
-- ================================================

-- Actualizar campos KYC en profiles
UPDATE profiles
SET
    kyc_status = 'approved',      -- ✅ Estado: aprobado
    kyc_verified = true,          -- ✅ Verificado: true
    updated_at = NOW()
WHERE email = 'support@alphaglobalmarket.io'
RETURNING
    id,
    email,
    username,
    kyc_status as "KYC Status (debe ser approved)",
    kyc_verified as "KYC Verified (debe ser true)",
    updated_at as "Actualizado";

-- ================================================
-- VERIFICACIÓN
-- ================================================
SELECT
    '✅ KYC APROBADO' as resultado,
    id,
    email,
    username,
    role,
    kyc_status,
    kyc_verified,
    status,
    updated_at
FROM profiles
WHERE email = 'support@alphaglobalmarket.io';

-- Ver todos los usuarios con KYC aprobado
SELECT
    '📋 TODOS CON KYC APROBADO' as lista,
    email,
    username,
    role,
    kyc_status,
    kyc_verified
FROM profiles
WHERE kyc_verified = true
ORDER BY updated_at DESC;
