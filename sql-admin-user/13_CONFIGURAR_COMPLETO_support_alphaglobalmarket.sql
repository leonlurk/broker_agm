-- ================================================
-- CONFIGURACIÓN COMPLETA: support@alphaglobalmarket.io
-- ================================================
-- Este script hace TODO lo necesario:
-- 1. Crea perfil con rol admin (si no existe)
-- 2. Actualiza contraseña a la nueva
-- 3. Verifica todo
-- ================================================
-- Email:    support@alphaglobalmarket.io
-- Password: AGM$upp0rt2025!Secur3#Pro
-- Username: support_agm
-- Rol:      admin
-- ================================================

-- Paso 1: Verificar extensión
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Paso 2: Actualizar contraseña en auth.users
UPDATE auth.users
SET
    encrypted_password = crypt('AGM$upp0rt2025!Secur3#Pro', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email = 'support@alphaglobalmarket.io';

-- Paso 3: Crear o actualizar perfil con rol ADMIN
INSERT INTO public.profiles (
    id,
    email,
    username,
    role,
    status,
    broker_balance,
    email_verified,
    kyc_status,
    created_at,
    updated_at
)
SELECT
    id,
    email,
    'support_agm',
    'admin',  -- ✅ ROL ADMINISTRADOR
    'active',
    0.00,
    true,
    'not_submitted',
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'support@alphaglobalmarket.io'
ON CONFLICT (id) DO UPDATE
SET
    role = 'admin',  -- ✅ FORZAR ROL ADMIN
    status = 'active',
    email_verified = true,
    username = COALESCE(profiles.username, 'support_agm'),
    kyc_status = COALESCE(profiles.kyc_status, 'not_submitted'),
    updated_at = NOW();

-- ================================================
-- VERIFICACIÓN COMPLETA
-- ================================================
SELECT
    '✅ CONFIGURACIÓN COMPLETA' as resultado,
    a.id as uuid,
    a.email,
    p.username,
    p.role as "ROL (debe ser admin)",
    p.status,
    a.email_confirmed_at as "email_confirmado",
    a.updated_at as "password_actualizada"
FROM auth.users a
LEFT JOIN profiles p ON p.id = a.id
WHERE a.email = 'support@alphaglobalmarket.io';

-- ================================================
-- CREDENCIALES FINALES
-- ================================================
SELECT
    '🔐 USA ESTAS CREDENCIALES' as info,
    'support@alphaglobalmarket.io' as "Email",
    'AGM$upp0rt2025!Secur3#Pro' as "Password",
    'support_agm' as "Username",
    'admin' as "Rol";

-- ================================================
-- LISTA DE TODOS LOS ADMINS
-- ================================================
SELECT
    '📋 ADMINISTRADORES' as lista,
    email,
    username,
    role,
    status
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;
