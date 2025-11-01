-- ================================================
-- CREAR ADMINISTRADOR (VERSIÓN SIMPLE)
-- support@alphaglobalmarket.io
-- ================================================
-- Esta versión es más simple y muestra errores claramente
-- ================================================

-- PASO 1: Verificar que pgcrypto está instalada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PASO 2: Crear usuario en auth.users
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
ON CONFLICT (email) DO NOTHING
RETURNING id, email;

-- ⚠️ IMPORTANTE: Copia el UUID que aparece arriba

-- PASO 3: Crear perfil en profiles (REEMPLAZA el UUID)
-- Ejecuta esta query DESPUÉS de obtener el UUID del paso anterior
INSERT INTO public.profiles (
    id,  -- ✅ PEGA AQUÍ EL UUID DEL PASO 2
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
VALUES (
    'REEMPLAZA-CON-UUID-DEL-PASO-2',  -- ✅ CAMBIAR ESTO
    'support@alphaglobalmarket.io',
    'support_agm',
    'admin',  -- ✅ ROL ADMIN
    'active',
    0.00,
    true,
    'not_submitted',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET
    role = 'admin',
    status = 'active',
    email_verified = true,
    kyc_status = 'not_submitted',
    updated_at = NOW()
RETURNING id, email, username, role;

-- PASO 4: Verificar creación
SELECT
    a.id,
    a.email,
    p.username,
    p.role,
    p.status,
    a.created_at
FROM auth.users a
LEFT JOIN profiles p ON p.id = a.id
WHERE a.email = 'support@alphaglobalmarket.io';
