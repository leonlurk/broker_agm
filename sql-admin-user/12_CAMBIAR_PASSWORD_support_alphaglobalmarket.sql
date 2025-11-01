-- ================================================
-- CAMBIAR CONTRASEÑA: support@alphaglobalmarket.io
-- ================================================
-- El usuario YA EXISTÍA desde septiembre con otra password
-- Este script actualiza la contraseña a la nueva
-- ================================================
-- Nueva Password: AGM$upp0rt2025!Secur3#Pro
-- ================================================

-- Verificar que pgcrypto está instalada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Actualizar contraseña en auth.users
UPDATE auth.users
SET
    encrypted_password = crypt('AGM$upp0rt2025!Secur3#Pro', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'support@alphaglobalmarket.io'
RETURNING id, email, updated_at;

-- ================================================
-- VERIFICAR USUARIO COMPLETO
-- ================================================
SELECT
    '✅ PASSWORD ACTUALIZADA' as resultado,
    a.id as uuid,
    a.email,
    a.updated_at as "password_actualizada",
    p.username,
    p.role as "ROL (debe ser admin)",
    p.status
FROM auth.users a
LEFT JOIN profiles p ON p.id = a.id
WHERE a.email = 'support@alphaglobalmarket.io';

-- ================================================
-- INFORMACIÓN FINAL
-- ================================================
SELECT
    '📋 CREDENCIALES FINALES' as info,
    'support@alphaglobalmarket.io' as email,
    'AGM$upp0rt2025!Secur3#Pro' as password_nueva,
    'support_agm' as username,
    'admin' as rol;
