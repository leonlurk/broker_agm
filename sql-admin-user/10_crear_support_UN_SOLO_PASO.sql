-- ================================================
-- CREAR ADMINISTRADOR EN UN SOLO PASO
-- support@alphaglobalmarket.io
-- ================================================
-- Email:    support@alphaglobalmarket.io
-- Password: AGM$upp0rt2025!Secur3#Pro
-- Username: support_agm
-- Rol:      admin
-- ================================================

-- Verificar extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear en auth.users Y profiles en una sola transacción
WITH new_user AS (
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'support@alphaglobalmarket.io',
        crypt('AGM$upp0rt2025!Secur3#Pro', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"Support - Alpha Global Market"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    ON CONFLICT (email) DO UPDATE
    SET updated_at = NOW()
    RETURNING id, email
)
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
FROM new_user
ON CONFLICT (id) DO UPDATE
SET
    role = 'admin',  -- ✅ FORZAR ROL ADMIN
    status = 'active',
    email_verified = true,
    kyc_status = 'not_submitted',
    updated_at = NOW()
RETURNING id, email, username, role, status;

-- Verificar creación inmediatamente
SELECT
    '✅ VERIFICACIÓN FINAL' as resultado,
    a.id as uuid,
    a.email,
    p.username,
    p.role as "ROL (debe ser admin)",
    p.status,
    a.email_confirmed_at as "email_confirmado",
    a.created_at as "fecha_creacion"
FROM auth.users a
LEFT JOIN profiles p ON p.id = a.id
WHERE a.email = 'support@alphaglobalmarket.io';

-- Listar todos los admins
SELECT
    '📋 TODOS LOS ADMINS' as lista,
    email,
    username,
    role,
    status,
    created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;
