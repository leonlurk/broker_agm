-- Verificar los secrets de 2FA en la base de datos
-- Este script ayuda a identificar secrets inválidos

-- 1. Ver todos los secrets de 2FA (solo primeros caracteres para seguridad)
SELECT 
    user_id,
    is_enabled,
    LEFT(secret_key, 10) as secret_preview,
    LENGTH(secret_key) as secret_length,
    CASE 
        WHEN secret_key ~ '^[A-Z2-7]+=*$' THEN '✅ Valid Base32'
        WHEN secret_key ~ '[0-9]' AND secret_key !~ '^[A-Z2-7]+=*$' THEN '❌ Contains invalid digits'
        WHEN secret_key ~ '[a-z]' THEN '⚠️ Contains lowercase'
        ELSE '❌ Invalid format'
    END as secret_status,
    created_at,
    updated_at
FROM user_2fa
WHERE is_enabled = true
ORDER BY created_at DESC;

-- 2. Contar usuarios con secrets inválidos
SELECT 
    COUNT(*) FILTER (WHERE secret_key ~ '^[A-Z2-7]+=*$') as valid_secrets,
    COUNT(*) FILTER (WHERE secret_key !~ '^[A-Z2-7]+=*$') as invalid_secrets,
    COUNT(*) as total_2fa_users
FROM user_2fa
WHERE is_enabled = true;

-- 3. Si necesitas regenerar un secret para un usuario específico
-- NOTA: Esto requiere que el usuario reconfigure su app autenticadora
-- UPDATE user_2fa 
-- SET secret_key = 'NUEVO_SECRET_BASE32_AQUI',
--     updated_at = NOW()
-- WHERE user_id = 'USER_ID_AQUI';