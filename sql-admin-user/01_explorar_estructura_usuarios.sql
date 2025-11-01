-- ================================================
-- PASO 1: EXPLORAR ESTRUCTURA DE USUARIOS
-- ================================================
-- Este archivo te muestra toda la información actual
-- de usuarios, roles y estructura de tablas
-- ================================================

-- 1️⃣ Ver estructura completa de la tabla profiles
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2️⃣ Ver usuarios existentes y sus roles
SELECT
    p.id,
    p.email,
    p.username,
    p.role,
    p.status,
    p.created_at,
    p.broker_balance
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 10;

-- 3️⃣ Ver qué roles existen en el sistema
SELECT DISTINCT role
FROM profiles
WHERE role IS NOT NULL
ORDER BY role;

-- 4️⃣ Ver usuarios administradores existentes
SELECT
    id,
    email,
    username,
    role,
    status,
    created_at
FROM profiles
WHERE role = 'admin'
   OR role = 'administrator'
   OR role ILIKE '%admin%';

-- 5️⃣ Contar usuarios por rol
SELECT
    COALESCE(role, 'sin_rol') as rol,
    COUNT(*) as cantidad
FROM profiles
GROUP BY role
ORDER BY cantidad DESC;
