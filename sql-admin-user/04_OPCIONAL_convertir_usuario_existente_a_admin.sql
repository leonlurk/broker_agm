-- ================================================
-- OPCIONAL: CONVERTIR USUARIO EXISTENTE A ADMIN
-- ================================================
-- Usa este archivo SI YA TIENES un usuario registrado
-- y solo quieres convertirlo a administrador
-- ================================================

-- ⚠️ ANTES DE EJECUTAR:
-- Reemplaza 'tu-email@dominio.com' con tu email actual
-- ================================================

-- 1️⃣ Primero, busca tu usuario actual
SELECT
    id,
    email,
    username,
    role,
    status
FROM profiles
WHERE email = 'tu-email@dominio.com';  -- ✅ CAMBIAR ESTE EMAIL

-- 2️⃣ Actualizar rol a admin
UPDATE profiles
SET
    role = 'admin',
    status = 'active',
    email_verified = true,
    kyc_status = COALESCE(kyc_status, 'not_submitted'),  -- ✅ Mantener valor actual o usar default
    updated_at = NOW()
WHERE email = 'tu-email@dominio.com';  -- ✅ CAMBIAR ESTE EMAIL

-- 3️⃣ Verificar cambio
SELECT
    id,
    email,
    username,
    role,
    status,
    updated_at
FROM profiles
WHERE email = 'tu-email@dominio.com';  -- ✅ CAMBIAR ESTE EMAIL

-- ✅ Deberías ver ahora role = 'admin'
