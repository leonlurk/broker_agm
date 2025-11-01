-- ================================================
-- CREAR PERFIL PARA support@alphaglobalmarket.io
-- ================================================
-- El usuario YA EXISTE en auth.users
-- Solo falta crear su perfil en profiles con rol ADMIN
-- ================================================
-- UUID: a153a6d6-e48d-4297-9a64-395c462e138f
-- Email: support@alphaglobalmarket.io
-- Password: AGM$upp0rt2025!Secur3#Pro (ya configurado)
-- ================================================

-- Crear perfil con rol ADMIN
INSERT INTO public.profiles (
    id,
    email,
    username,
    role,  -- ✅ ROL ADMINISTRADOR
    status,
    broker_balance,
    email_verified,
    kyc_status,
    created_at,
    updated_at
)
VALUES (
    'a153a6d6-e48d-4297-9a64-395c462e138f',  -- ✅ UUID del usuario en auth.users
    'support@alphaglobalmarket.io',
    'support_agm',
    'admin',  -- ✅ ROL ADMINISTRADOR
    'active',
    0.00,
    true,
    'not_submitted',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET
    role = 'admin',  -- ✅ FORZAR ROL ADMIN si ya existe
    status = 'active',
    email_verified = true,
    kyc_status = COALESCE(profiles.kyc_status, 'not_submitted'),
    updated_at = NOW()
RETURNING id, email, username, role, status;

-- ================================================
-- VERIFICAR CREACIÓN
-- ================================================
SELECT
    '✅ PERFIL CREADO' as resultado,
    a.id as uuid,
    a.email,
    p.username,
    p.role as "ROL (debe ser admin)",
    p.status,
    a.email_confirmed_at as "email_confirmado",
    a.created_at as "fecha_creacion_auth",
    p.created_at as "fecha_creacion_perfil"
FROM auth.users a
LEFT JOIN profiles p ON p.id = a.id
WHERE a.email = 'support@alphaglobalmarket.io';

-- ================================================
-- LISTAR TODOS LOS ADMINISTRADORES
-- ================================================
SELECT
    '📋 TODOS LOS ADMINS (incluyendo el nuevo)' as lista,
    email,
    username,
    role,
    status,
    created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;
