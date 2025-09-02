-- ========================================
-- Sincronizar datos KYC entre tablas
-- ========================================

-- 1. Ver usuarios con KYC aprobado en profiles pero sin registro en kyc_verifications
SELECT 
  p.id,
  p.email,
  p.username,
  p.kyc_status as profile_kyc_status,
  p.kyc_verified,
  kv.status as verification_status,
  kv.id as verification_id
FROM profiles p
LEFT JOIN kyc_verifications kv ON p.id = kv.user_id
WHERE p.kyc_status = 'approved'
ORDER BY p.created_at DESC;

-- 2. Ver todos los registros en kyc_verifications
SELECT 
  id,
  user_id,
  email,
  status,
  submitted_at,
  reviewed_at
FROM kyc_verifications
ORDER BY created_at DESC;

-- 3. OPCIÓN A: Si quieres que los usuarios con KYC aprobado en profiles puedan volver a enviar documentos
-- Actualiza su estado a 'not_submitted' para que puedan usar el formulario KYC nuevamente
UPDATE profiles 
SET 
  kyc_status = 'not_submitted',
  kyc_verified = false,
  updated_at = NOW()
WHERE kyc_status = 'approved' 
  AND id NOT IN (
    SELECT user_id 
    FROM kyc_verifications 
    WHERE status = 'approved'
  );

-- 4. OPCIÓN B: Si quieres crear registros en kyc_verifications para usuarios ya aprobados
-- (Descomenta si prefieres esta opción)
/*
INSERT INTO kyc_verifications (
  user_id,
  email,
  status,
  submitted_at,
  reviewed_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  p.email,
  'approved',
  COALESCE(p.kyc_submitted, p.created_at),
  COALESCE(p.kyc_reviewed, NOW()),
  NOW(),
  NOW()
FROM profiles p
LEFT JOIN kyc_verifications kv ON p.id = kv.user_id
WHERE p.kyc_status = 'approved' 
  AND kv.id IS NULL;
*/

-- 5. Verificar el resultado
SELECT 
  'Profiles con KYC approved' as tabla,
  COUNT(*) as total
FROM profiles
WHERE kyc_status = 'approved'
UNION ALL
SELECT 
  'KYC Verifications approved' as tabla,
  COUNT(*) as total
FROM kyc_verifications
WHERE status = 'approved';

-- 6. Ver estado final de sincronización
SELECT 
  p.id,
  p.email,
  p.username,
  p.kyc_status as profile_status,
  kv.status as verification_status,
  CASE 
    WHEN p.kyc_status = kv.status THEN 'Sincronizado'
    WHEN kv.status IS NULL THEN 'Sin verificación'
    ELSE 'Desincronizado'
  END as sync_status
FROM profiles p
LEFT JOIN kyc_verifications kv ON p.id = kv.user_id
WHERE p.kyc_status != 'not_submitted'
ORDER BY sync_status, p.created_at DESC;