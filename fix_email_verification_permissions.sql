-- ========================================
-- Fix Email Verification Permissions & Tables
-- ========================================
-- Este script corrige los permisos de las tablas para permitir
-- la verificación de email y el reenvío de correos de verificación

-- 1. Primero verificar si existe la tabla 'users' o debemos usar 'profiles'
-- Si no existe la tabla 'users', la creamos como vista de 'profiles'
CREATE OR REPLACE VIEW users AS 
SELECT 
  id,
  username,
  email,
  nombre,
  email_verified,
  verification_token,
  created_at,
  updated_at
FROM profiles;

-- 2. Asegurar que la tabla profiles tiene todas las columnas necesarias
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_token TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Habilitar RLS en profiles si no está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas existentes que puedan causar conflicto
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;

-- 5. Crear políticas específicas para la verificación de email

-- Política para permitir que usuarios autenticados lean cualquier perfil
-- (necesario para verificar si un email ya existe)
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
  FOR SELECT
  USING (true);

-- Política para permitir que usuarios se inserten a sí mismos
CREATE POLICY "Allow users to insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política para permitir que usuarios actualicen su propio perfil
CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política especial para permitir actualizaciones por email (para verificación)
-- Esta es crítica para el reenvío de emails
CREATE POLICY "Allow email verification updates" ON profiles
  FOR UPDATE
  USING (
    -- Permitir si el usuario está autenticado y es su propio perfil
    auth.uid() = id 
    OR 
    -- O si el email coincide con el del usuario autenticado
    email = auth.jwt() ->> 'email'
  )
  WITH CHECK (
    auth.uid() = id 
    OR 
    email = auth.jwt() ->> 'email'
  );

-- 6. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON profiles(verification_token);

-- 7. Habilitar RLS en la vista users también
ALTER VIEW users SET (security_invoker = true);

-- 8. Crear función para verificar email
CREATE OR REPLACE FUNCTION verify_user_email(token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Buscar el usuario con el token
  SELECT id INTO user_id
  FROM profiles
  WHERE verification_token = token
  LIMIT 1;
  
  -- Si no se encuentra, retornar false
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Actualizar el estado de verificación
  UPDATE profiles
  SET 
    email_verified = true,
    verification_token = NULL,
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Crear función para reenviar email de verificación (helper)
CREATE OR REPLACE FUNCTION request_email_verification(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  new_token TEXT;
BEGIN
  -- Generar nuevo token
  new_token := gen_random_uuid()::TEXT;
  
  -- Buscar y actualizar el usuario
  UPDATE profiles
  SET 
    verification_token = new_token,
    updated_at = NOW()
  WHERE email = user_email
  RETURNING id, username, email INTO user_record;
  
  -- Si no se encuentra el usuario, retornar error
  IF user_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Retornar información para enviar el email
  RETURN json_build_object(
    'success', true,
    'user_id', user_record.id,
    'username', user_record.username,
    'email', user_record.email,
    'token', new_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Crear tabla para rastrear intentos de reenvío (rate limiting)
CREATE TABLE IF NOT EXISTS email_verification_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_verification_attempts_email 
ON email_verification_attempts(email, attempted_at DESC);

-- 11. Política para la tabla de intentos
ALTER TABLE email_verification_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert verification attempts" ON email_verification_attempts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read own verification attempts" ON email_verification_attempts
  FOR SELECT
  USING (email = auth.jwt() ->> 'email');

-- 12. Función para verificar rate limiting
CREATE OR REPLACE FUNCTION check_email_verification_rate_limit(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  recent_attempts INTEGER;
BEGIN
  -- Contar intentos en los últimos 60 segundos
  SELECT COUNT(*) INTO recent_attempts
  FROM email_verification_attempts
  WHERE email = user_email
    AND attempted_at > NOW() - INTERVAL '60 seconds';
  
  -- Permitir máximo 1 intento cada 60 segundos
  RETURN recent_attempts = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Crear trigger para limpiar intentos antiguos
CREATE OR REPLACE FUNCTION clean_old_verification_attempts()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar intentos de más de 24 horas
  DELETE FROM email_verification_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger (se ejecuta cada vez que se inserta un nuevo intento)
DROP TRIGGER IF EXISTS trigger_clean_verification_attempts ON email_verification_attempts;
CREATE TRIGGER trigger_clean_verification_attempts
  AFTER INSERT ON email_verification_attempts
  FOR EACH STATEMENT
  EXECUTE FUNCTION clean_old_verification_attempts();

-- 14. Grant permissions for authenticated users
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (email_verified, verification_token, updated_at) ON profiles TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT EXECUTE ON FUNCTION verify_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION request_email_verification TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_verification_rate_limit TO authenticated;

-- 15. Grant permissions for anon users (for email verification links)
GRANT EXECUTE ON FUNCTION verify_user_email TO anon;

-- ========================================
-- IMPORTANTE: Ejecutar este script en Supabase
-- ========================================
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Ve a SQL Editor
-- 3. Pega este script completo
-- 4. Ejecuta el script
-- 5. Verifica que no haya errores
--
-- Este script:
-- - Crea una vista 'users' que mapea a 'profiles'
-- - Agrega columnas necesarias para verificación de email
-- - Configura políticas RLS apropiadas
-- - Crea funciones helper para verificación
-- - Implementa rate limiting
-- - Configura permisos correctos
-- ========================================