-- ========================================
-- Script SEGURO para agregar campos KYC
-- ========================================
-- Este script corrige datos existentes antes de agregar constraints

-- 1. Primero, ver qué valores tiene actualmente kyc_status
SELECT DISTINCT kyc_status, COUNT(*) as count
FROM profiles
WHERE kyc_status IS NOT NULL
GROUP BY kyc_status;

-- 2. Agregar el campo kyc_status si no existe (sin constraint por ahora)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_submitted';

-- 3. Corregir cualquier valor inválido de kyc_status
UPDATE profiles 
SET kyc_status = 'not_submitted'
WHERE kyc_status IS NULL 
   OR kyc_status = ''
   OR kyc_status NOT IN ('not_submitted', 'pending', 'approved', 'rejected');

-- 4. Ahora sí agregar el constraint (solo si no existe)
DO $$ 
BEGIN
  -- Primero eliminar el constraint si existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_kyc_status_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_kyc_status_check;
  END IF;
  
  -- Ahora agregar el constraint nuevo
  ALTER TABLE profiles 
  ADD CONSTRAINT profiles_kyc_status_check 
  CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected'));
END $$;

-- 5. Agregar campo kyc_verified si no existe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false;

-- 6. Agregar timestamps para KYC (sin el _at que puede causar problemas)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS kyc_submitted TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS kyc_reviewed TIMESTAMP WITH TIME ZONE;

-- 7. Si los campos con _at ya existen, copiar los datos
DO $$
BEGIN
  -- Check if old columns exist and copy data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'kyc_submitted_at'
  ) THEN
    UPDATE profiles SET kyc_submitted = kyc_submitted_at WHERE kyc_submitted_at IS NOT NULL;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'kyc_reviewed_at'
  ) THEN
    UPDATE profiles SET kyc_reviewed = kyc_reviewed_at WHERE kyc_reviewed_at IS NOT NULL;
  END IF;
END $$;

-- 8. Verificar que los campos se agregaron correctamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('kyc_status', 'kyc_verified', 'kyc_submitted', 'kyc_reviewed')
ORDER BY column_name;

-- 9. Ver el estado actual de KYC de todos los usuarios
SELECT 
  id,
  email,
  username,
  kyc_status,
  kyc_verified,
  kyc_submitted,
  kyc_reviewed,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 10. Contar usuarios por estado KYC
SELECT 
  kyc_status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN kyc_verified = true THEN 1 END) as verified_count
FROM profiles
GROUP BY kyc_status
ORDER BY total_users DESC;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- Todos los usuarios deberían tener:
-- - kyc_status = 'not_submitted' (por defecto)
-- - kyc_verified = false (por defecto)
-- - Campos de timestamp disponibles
-- ========================================