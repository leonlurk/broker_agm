-- Script para marcar todos los usuarios existentes como verificados
-- Solo los nuevos usuarios (creados después de ejecutar este script) necesitarán verificación

-- Marcar todos los usuarios existentes como verificados
UPDATE profiles 
SET 
    email_verified = true,
    verified_at = COALESCE(verified_at, NOW()),
    updated_at = NOW()
WHERE 
    email_verified IS NULL 
    OR email_verified = false;

-- Verificar cuántos usuarios fueron actualizados
SELECT 
    COUNT(*) as usuarios_actualizados,
    COUNT(CASE WHEN email_verified = true THEN 1 END) as usuarios_verificados,
    COUNT(CASE WHEN email_verified = false THEN 1 END) as usuarios_sin_verificar
FROM profiles;

-- Ver detalles de usuarios que quedan sin verificar (deberían ser 0)
SELECT 
    id,
    email,
    username,
    created_at,
    email_verified
FROM profiles
WHERE email_verified = false
ORDER BY created_at DESC;