-- ========================================
-- Diagnóstico del Sistema KYC
-- ========================================
-- Este script analiza las tablas y estructuras KYC existentes

-- 1. Verificar si existe la tabla kyc_verifications
SELECT 
  'kyc_verifications table exists' as check_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'kyc_verifications'
  ) as result;

-- 2. Verificar estructura de la tabla kyc_verifications (si existe)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'kyc_verifications'
ORDER BY ordinal_position;

-- 3. Verificar campos KYC en la tabla profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('kyc_status', 'kyc_verified', 'kyc_submitted_at', 'kyc_reviewed_at')
ORDER BY column_name;

-- 4. Verificar funciones RPC relacionadas con KYC
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%kyc%'
ORDER BY routine_name;

-- 5. Ver los últimos registros de KYC (si existen)
SELECT 
  id,
  user_id,
  email,
  status,
  submitted_at,
  reviewed_at,
  created_at
FROM kyc_verifications
ORDER BY created_at DESC
LIMIT 5;

-- 6. Ver el estado KYC de los usuarios en profiles
SELECT 
  id,
  email,
  username,
  kyc_status,
  kyc_verified,
  kyc_submitted_at,
  kyc_reviewed_at
FROM profiles
WHERE kyc_status IS NOT NULL 
  OR kyc_verified IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 7. Verificar políticas RLS en kyc_verifications
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'kyc_verifications';

-- 8. Verificar si existe el bucket kyc-documents en storage
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'kyc-documents' OR name = 'kyc-documents';

-- 9. Contar documentos KYC en storage (si existe el bucket)
SELECT 
  COUNT(*) as total_documents,
  COUNT(DISTINCT (string_to_array(name, '/'))[1]) as total_users_with_docs
FROM storage.objects
WHERE bucket_id = 'kyc-documents';

-- 10. Verificar índices en kyc_verifications
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'kyc_verifications';

-- 11. Verificar triggers en kyc_verifications
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'kyc_verifications';

-- 12. Verificar constraints en kyc_verifications
SELECT 
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'kyc_verifications';

-- ========================================
-- RESUMEN DE DIAGNÓSTICO
-- ========================================
-- Este script te mostrará:
-- 1. Si las tablas KYC existen
-- 2. La estructura actual de las tablas
-- 3. Los datos existentes
-- 4. Las funciones RPC disponibles
-- 5. Las políticas de seguridad configuradas
-- 6. El estado del storage para documentos
--
-- Ejecuta este script primero para entender
-- el estado actual del sistema KYC
-- ========================================