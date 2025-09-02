-- ========================================
-- Actualizar usuarios existentes con campos KYC
-- ========================================

-- 1. Ver cuántos usuarios NO tienen kyc_status definido
SELECT 
  COUNT(*) as usuarios_sin_kyc_status,
  COUNT(CASE WHEN kyc_status IS NULL THEN 1 END) as kyc_null,
  COUNT(CASE WHEN kyc_status = '' THEN 1 END) as kyc_vacio
FROM profiles;

-- 2. Ver usuarios específicos sin KYC status
SELECT 
  id,
  email,
  username,
  kyc_status,
  kyc_verified,
  created_at
FROM profiles
WHERE kyc_status IS NULL 
   OR kyc_status = ''
ORDER BY created_at DESC
LIMIT 20;

-- 3. IMPORTANTE: Actualizar TODOS los usuarios que no tienen kyc_status
UPDATE profiles 
SET 
  kyc_status = CASE 
    WHEN kyc_status IS NULL THEN 'not_submitted'
    WHEN kyc_status = '' THEN 'not_submitted'
    ELSE kyc_status
  END,
  kyc_verified = COALESCE(kyc_verified, false),
  updated_at = NOW()
WHERE kyc_status IS NULL 
   OR kyc_status = '';

-- 4. Verificar que la actualización funcionó
SELECT 
  kyc_status,
  COUNT(*) as total_users,
  MIN(created_at) as oldest_user,
  MAX(created_at) as newest_user
FROM profiles
GROUP BY kyc_status
ORDER BY total_users DESC;

-- 5. Ver el usuario específico con el que estás probando (reemplaza el email)
-- SELECT 
--   id,
--   email,
--   username,
--   kyc_status,
--   kyc_verified,
--   created_at,
--   updated_at
-- FROM profiles
-- WHERE email = 'TU_EMAIL_AQUI';

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- Después de ejecutar este script:
-- - TODOS los usuarios deberían tener kyc_status
-- - No debería haber ningún usuario con kyc_status NULL o vacío
-- - El cuadro amarillo debería aparecer para todos los usuarios
--   que no tienen KYC aprobado
-- ========================================