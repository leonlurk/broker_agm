-- ================================================
-- VER COLUMNAS REALES DE kyc_verifications
-- ================================================

-- Ver TODAS las columnas que realmente existen
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'kyc_verifications'
ORDER BY ordinal_position;

-- Ver también las de profiles para comparar
SELECT
    'Columnas KYC en profiles' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name ILIKE '%kyc%'
ORDER BY ordinal_position;

-- Ver datos actuales del usuario
SELECT
    'Estado actual de support@alphaglobalmarket.io' as info,
    email,
    kyc_status,
    kyc_verified
FROM profiles
WHERE email = 'support@alphaglobalmarket.io';
