-- ================================================
-- DIAGNÓSTICO: Verificar por qué no se creó support@alphaglobalmarket.io
-- ================================================

-- 1️⃣ Verificar si existe en auth.users
SELECT
    'En auth.users' as tabla,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'support@alphaglobalmarket.io';

-- 2️⃣ Verificar si existe en profiles
SELECT
    'En profiles' as tabla,
    id,
    email,
    username,
    role,
    status
FROM profiles
WHERE email = 'support@alphaglobalmarket.io';

-- 3️⃣ Buscar en auth.users por email similar
SELECT
    'Búsqueda similar' as tipo,
    email,
    created_at
FROM auth.users
WHERE email ILIKE '%alphaglobalmarket%'
   OR email ILIKE '%support%';

-- 4️⃣ Verificar que la extensión pgcrypto existe (necesaria para crypt)
SELECT
    'Extensión pgcrypto' as verificacion,
    extname as nombre,
    extversion as version
FROM pg_extension
WHERE extname = 'pgcrypto';

-- 5️⃣ Ver últimos usuarios creados en auth.users
SELECT
    'Últimos en auth.users' as tabla,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 6️⃣ Ver últimos usuarios creados en profiles
SELECT
    'Últimos en profiles' as tabla,
    email,
    username,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
