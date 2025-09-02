-- ========================================
-- Agregar campos KYC a la tabla profiles
-- ========================================
-- Este script agrega los campos KYC necesarios a la tabla profiles

-- 1. Agregar campo kyc_status si no existe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_submitted';

-- 2. Agregar constraint para valores válidos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_kyc_status_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_kyc_status_check 
    CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected'));
  END IF;
END $$;

-- 3. Agregar campo kyc_verified si no existe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false;

-- 4. Agregar timestamps para KYC
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMP WITH TIME ZONE;

-- 5. Verificar que los campos se agregaron correctamente
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

-- 6. Ver el estado actual de KYC de todos los usuarios
SELECT 
  id,
  email,
  username,
  kyc_status,
  kyc_verified,
  kyc_submitted_at,
  kyc_reviewed_at,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- ========================================
-- IMPORTANTE: 
-- Ejecuta este script en Supabase SQL Editor
-- para asegurar que los campos KYC existan
-- ========================================