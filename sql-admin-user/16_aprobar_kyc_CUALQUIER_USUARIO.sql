-- ================================================
-- APROBAR KYC - CUALQUIER USUARIO (TEMPLATE)
-- ================================================
-- Este script aprueba el KYC de cualquier usuario
-- Reemplaza el email en las 3 ubicaciones marcadas
-- ================================================

-- ⚠️ ANTES DE EJECUTAR:
-- Reemplaza 'usuario@example.com' con el email del usuario
-- (aparece 3 veces en este archivo)
-- ================================================

-- Paso 1: Actualizar campos KYC en profiles
UPDATE profiles
SET
    kyc_status = 'approved',
    kyc_verified = true,
    updated_at = NOW()
WHERE email = 'usuario@example.com'  -- ✅ CAMBIAR AQUÍ
RETURNING id, email, username, kyc_status, kyc_verified;

-- Paso 2: Actualizar o crear registro en kyc_verifications
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
SELECT
    gen_random_uuid(),
    p.id,
    p.email,
    'N/A',
    'N/A',
    'MANUAL_APPROVAL',
    'N/A',
    'N/A',
    'N/A',
    'N/A',
    'approved',
    NOW(),
    NOW(),
    NOW(),
    NOW()
FROM profiles p
WHERE p.email = 'usuario@example.com'  -- ✅ CAMBIAR AQUÍ
ON CONFLICT (user_id) DO UPDATE
SET
    status = 'approved',
    reviewed_at = NOW(),
    updated_at = NOW()
RETURNING id, email, status;

-- ================================================
-- VERIFICACIÓN
-- ================================================
SELECT
    '✅ VERIFICACIÓN KYC APROBADO' as resultado,
    p.id,
    p.email,
    p.username,
    p.kyc_status,
    p.kyc_verified,
    k.status as "status_kyc_verifications",
    k.reviewed_at
FROM profiles p
LEFT JOIN kyc_verifications k ON k.user_id = p.id::text
WHERE p.email = 'usuario@example.com';  -- ✅ CAMBIAR AQUÍ
