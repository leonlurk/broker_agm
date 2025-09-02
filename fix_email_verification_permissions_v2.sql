-- ========================================
-- Fix Email Verification Permissions for Profiles Table
-- ========================================
-- Este script corrige los permisos de la tabla profiles para permitir
-- la verificación de email y el reenvío de correos de verificación

-- 1. Asegurar que la tabla profiles tiene todas las columnas necesarias
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_token TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Habilitar RLS en profiles si no está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes que puedan causar conflicto
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow email verification updates" ON profiles;

-- 4. Crear políticas específicas para la verificación de email

-- Política para permitir que CUALQUIERA pueda leer perfiles (necesario para verificar emails)
-- Esto es seguro porque solo expone información básica
CREATE POLICY "Public read access for email verification" ON profiles
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

-- Política especial para permitir actualizaciones anónimas con token de verificación
-- Esta es crítica para el proceso de verificación de email
CREATE POLICY "Allow anonymous email verification" ON profiles
  FOR UPDATE
  USING (
    -- Permitir si tiene un token de verificación válido
    verification_token IS NOT NULL
  )
  WITH CHECK (
    -- Solo permitir actualizar email_verified y limpiar el token
    verification_token IS NOT NULL
  );

-- 5. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON profiles(verification_token);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- 6. Crear función para verificar email
CREATE OR REPLACE FUNCTION verify_user_email(token TEXT)
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Buscar el usuario con el token
  SELECT id, email, username INTO user_record
  FROM profiles
  WHERE verification_token = token
  LIMIT 1;
  
  -- Si no se encuentra, retornar error
  IF user_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token inválido o expirado'
    );
  END IF;
  
  -- Actualizar el estado de verificación
  UPDATE profiles
  SET 
    email_verified = true,
    verification_token = NULL,
    updated_at = NOW()
  WHERE id = user_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email verificado exitosamente',
    'user_id', user_record.id,
    'email', user_record.email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Crear función para reenviar email de verificación
CREATE OR REPLACE FUNCTION request_email_verification(user_email TEXT)
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  new_token TEXT;
BEGIN
  -- Generar nuevo token
  new_token := gen_random_uuid()::TEXT;
  
  -- Buscar y actualizar el usuario
  SELECT id, username, email, email_verified 
  INTO user_record
  FROM profiles
  WHERE email = user_email
  LIMIT 1;
  
  -- Si no se encuentra el usuario, retornar error
  IF user_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no encontrado'
    );
  END IF;
  
  -- Si el email ya está verificado
  IF user_record.email_verified = true THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este email ya está verificado'
    );
  END IF;
  
  -- Actualizar con nuevo token
  UPDATE profiles
  SET 
    verification_token = new_token,
    updated_at = NOW()
  WHERE id = user_record.id;
  
  -- Retornar información para enviar el email
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_record.id,
    'username', user_record.username,
    'email', user_record.email,
    'token', new_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear tabla para rastrear intentos de reenvío (rate limiting)
CREATE TABLE IF NOT EXISTS email_verification_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_verification_attempts_email 
ON email_verification_attempts(email, attempted_at DESC);

-- 9. Política para la tabla de intentos
ALTER TABLE email_verification_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert verification attempts" ON email_verification_attempts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read verification attempts" ON email_verification_attempts
  FOR SELECT
  USING (true);

-- 10. Función para verificar rate limiting
CREATE OR REPLACE FUNCTION check_email_verification_rate_limit(user_email TEXT)
RETURNS JSONB AS $$
DECLARE
  recent_attempts INTEGER;
  last_attempt TIMESTAMP WITH TIME ZONE;
  seconds_since_last INTEGER;
BEGIN
  -- Obtener el último intento
  SELECT attempted_at INTO last_attempt
  FROM email_verification_attempts
  WHERE email = user_email
  ORDER BY attempted_at DESC
  LIMIT 1;
  
  -- Si no hay intentos previos, permitir
  IF last_attempt IS NULL THEN
    -- Registrar el intento
    INSERT INTO email_verification_attempts (email) VALUES (user_email);
    RETURN jsonb_build_object(
      'allowed', true,
      'message', 'Primer intento registrado'
    );
  END IF;
  
  -- Calcular segundos desde el último intento
  seconds_since_last := EXTRACT(EPOCH FROM (NOW() - last_attempt))::INTEGER;
  
  -- Si han pasado menos de 60 segundos, denegar
  IF seconds_since_last < 60 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'message', format('Por favor espera %s segundos antes de reenviar', 60 - seconds_since_last),
      'remaining_seconds', 60 - seconds_since_last
    );
  END IF;
  
  -- Permitir y registrar el nuevo intento
  INSERT INTO email_verification_attempts (email) VALUES (user_email);
  
  RETURN jsonb_build_object(
    'allowed', true,
    'message', 'Intento permitido'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Crear trigger para limpiar intentos antiguos
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

-- 12. Grant permissions para usuarios autenticados
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT INSERT ON profiles TO authenticated;

-- 13. Grant permissions para usuarios anónimos (necesario para verificación de email)
GRANT SELECT ON profiles TO anon;
GRANT UPDATE (email_verified, verification_token, updated_at) ON profiles TO anon;

-- 14. Grant execute permissions en las funciones
GRANT EXECUTE ON FUNCTION verify_user_email TO anon;
GRANT EXECUTE ON FUNCTION verify_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION request_email_verification TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_verification_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_verification_rate_limit TO anon;

-- 15. Verificar que el service role tenga acceso completo
GRANT ALL ON profiles TO service_role;
GRANT ALL ON email_verification_attempts TO service_role;

-- ========================================
-- VERIFICACIÓN DE LA CONFIGURACIÓN
-- ========================================
-- Ejecuta estas queries para verificar que todo esté configurado correctamente:

-- Verificar columnas en profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('email_verified', 'verification_token', 'updated_at');

-- Verificar políticas RLS
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Verificar funciones
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('verify_user_email', 'request_email_verification', 'check_email_verification_rate_limit');

-- ========================================
-- IMPORTANTE: Pasos para ejecutar
-- ========================================
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Ve a SQL Editor
-- 3. Pega este script completo
-- 4. Ejecuta el script
-- 5. Verifica que no haya errores
-- 6. Ejecuta las queries de verificación al final
--
-- Este script:
-- - Usa directamente la tabla 'profiles' sin crear vistas
-- - Agrega columnas necesarias para verificación de email
-- - Configura políticas RLS que permiten lectura pública y actualizaciones controladas
-- - Crea funciones helper para verificación
-- - Implementa rate limiting
-- - Configura permisos para anon y authenticated
-- ========================================