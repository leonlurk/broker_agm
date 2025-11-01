-- ================================================
-- PASO 3: VERIFICAR USUARIO ADMINISTRADOR CREADO
-- ================================================
-- Ejecuta esto después del PASO 2 para confirmar
-- que el usuario admin fue creado correctamente
-- ================================================

-- ⚠️ Reemplaza 'admin@tudominio.com' con el email que usaste
SET search_path TO public, auth;

-- 1️⃣ Verificar usuario en auth.users
SELECT
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    CASE
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
        ELSE '❌ No confirmado'
    END as estado_email
FROM auth.users
WHERE email = 'admin@tudominio.com';  -- ✅ CAMBIAR ESTE EMAIL

-- 2️⃣ Verificar perfil en profiles
SELECT
    id,
    email,
    username,
    role,
    status,
    email_verified,
    broker_balance,
    created_at,
    updated_at
FROM profiles
WHERE email = 'admin@tudominio.com';  -- ✅ CAMBIAR ESTE EMAIL

-- 3️⃣ Verificar datos completos (JOIN)
SELECT
    a.id as "UUID",
    a.email as "Email",
    p.username as "Username",
    p.role as "Rol",
    p.status as "Estado",
    a.email_confirmed_at as "Email Confirmado",
    p.broker_balance as "Balance",
    a.created_at as "Fecha Creación"
FROM auth.users a
LEFT JOIN profiles p ON p.id = a.id
WHERE a.email = 'admin@tudominio.com';  -- ✅ CAMBIAR ESTE EMAIL

-- 4️⃣ Verificar que es el único admin (o contar admins)
SELECT
    role,
    COUNT(*) as cantidad,
    STRING_AGG(email, ', ') as emails
FROM profiles
WHERE role = 'admin'
GROUP BY role;

-- 5️⃣ Ver últimos 5 usuarios creados (incluye el nuevo admin)
SELECT
    a.id,
    a.email,
    p.username,
    p.role,
    p.status,
    a.created_at
FROM auth.users a
LEFT JOIN profiles p ON p.id = a.id
ORDER BY a.created_at DESC
LIMIT 5;
