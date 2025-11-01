-- ================================================
-- APROBAR KYC: support@alphaglobalmarket.io
-- ================================================
-- Este script aprueba el KYC del usuario administrador
-- sin necesidad de documentos (es admin)
-- ================================================
-- Usuario: support@alphaglobalmarket.io
-- UUID: a153a6d6-e48d-4297-9a64-395c462e138f
-- ================================================

-- Paso 1: Actualizar campos KYC en profiles
UPDATE profiles
SET
    kyc_status = 'approved',      -- ✅ Estado: aprobado
    kyc_verified = true,          -- ✅ Verificado: true
    updated_at = NOW()
WHERE email = 'support@alphaglobalmarket.io'
RETURNING id, email, username, kyc_status, kyc_verified;

-- Paso 2: Crear registro en kyc_verifications (opcional pero recomendado)
-- Esto registra la aprobación en el historial
INSERT INTO kyc_verifications (
    id,
    user_id,
    email,
    residence_country,
    document_country,
    document_type,
    front_document_url,
    back_document_url,
    selfie_document_url,
    address_proof_url,
    status,
    submitted_at,
    reviewed_at,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    'a153a6d6-e48d-4297-9a64-395c462e138f',  -- UUID del usuario
    'support@alphaglobalmarket.io',
    'N/A',  -- No aplica para admin
    'N/A',
    'ADMIN_ACCOUNT',
    'N/A',  -- Sin documentos (es admin)
    'N/A',
    'N/A',
    'N/A',
    'approved',  -- ✅ Aprobado automáticamente
    NOW(),
    NOW(),  -- Revisado inmediatamente
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET
    status = 'approved',
    reviewed_at = NOW(),
    updated_at = NOW()
RETURNING id, email, status, reviewed_at;

-- ================================================
-- VERIFICACIÓN
-- ================================================

-- Verificar campos KYC en profiles
SELECT
    '✅ KYC APROBADO EN PROFILES' as resultado,
    id,
    email,
    username,
    kyc_status as "KYC Status (debe ser approved)",
    kyc_verified as "KYC Verified (debe ser true)",
    updated_at as "Actualizado"
FROM profiles
WHERE email = 'support@alphaglobalmarket.io';

-- Verificar registro en kyc_verifications
SELECT
    '✅ REGISTRO EN KYC_VERIFICATIONS' as resultado,
    id,
    email,
    status as "Status (debe ser approved)",
    submitted_at as "Enviado",
    reviewed_at as "Revisado"
FROM kyc_verifications
WHERE email = 'support@alphaglobalmarket.io';

-- Listar todos los usuarios con KYC aprobado
SELECT
    '📋 USUARIOS CON KYC APROBADO' as lista,
    email,
    username,
    kyc_status,
    kyc_verified,
    updated_at
FROM profiles
WHERE kyc_verified = true
ORDER BY updated_at DESC;
