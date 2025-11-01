-- ================================================
-- EXPLORAR ESTRUCTURA KYC
-- ================================================
-- Este script muestra toda la estructura relacionada con KYC
-- ================================================

-- 1️⃣ Ver estructura de la tabla kyc_verifications
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'kyc_verifications'
ORDER BY ordinal_position;

-- 2️⃣ Ver estructura de campos KYC en profiles
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name ILIKE '%kyc%'
ORDER BY ordinal_position;

-- 3️⃣ Ver valores actuales de KYC para support@alphaglobalmarket.io
SELECT
    'Datos KYC en profiles' as tabla,
    id,
    email,
    username,
    kyc_status,
    kyc_verified
FROM profiles
WHERE email = 'support@alphaglobalmarket.io';

-- 4️⃣ Ver si existe registro en kyc_verifications
SELECT
    'Datos en kyc_verifications' as tabla,
    id,
    user_id,
    email,
    status,
    submitted_at,
    reviewed_at
FROM kyc_verifications
WHERE email = 'support@alphaglobalmarket.io';

-- 5️⃣ Ver estados KYC permitidos (constraint check)
SELECT
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'profiles'
  AND con.conname ILIKE '%kyc%';

-- 6️⃣ Ver estados permitidos en kyc_verifications
SELECT
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'kyc_verifications'
  AND con.conname ILIKE '%status%';
