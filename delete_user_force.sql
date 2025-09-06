-- =========================================
-- SCRIPT FORZADO PARA ELIMINAR USUARIO DE SUPABASE
-- =========================================
-- Este script deshabilita temporalmente las restricciones de FK
-- para poder eliminar el usuario y todos sus datos
-- =========================================

-- OPCIÓN 1: Eliminar con CASCADE (más seguro)
-- Primero intenta eliminar el usuario con CASCADE
-- Esto eliminará automáticamente todos los registros relacionados

-- Eliminar usuario con CASCADE desde auth.users
DELETE FROM auth.users 
WHERE email = 'leonagustp@gmail.com' 
CASCADE;

-- Si el comando anterior falla, usa la OPCIÓN 2:

-- =========================================
-- OPCIÓN 2: Deshabilitar restricciones temporalmente
-- =========================================

BEGIN;

-- Deshabilitar triggers y restricciones temporalmente
SET session_replication_role = 'replica';

-- Ahora eliminar sin restricciones
DELETE FROM auth.users WHERE email = 'leonagustp@gmail.com';
DELETE FROM public.users WHERE id = 'dfe5c068-bddf-419d-b816-08303dd276ea';
DELETE FROM public.profiles WHERE id = 'dfe5c068-bddf-419d-b816-08303dd276ea';
DELETE FROM public.broker_accounts WHERE user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea' OR user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea'::text;

-- Rehabilitar triggers y restricciones
SET session_replication_role = 'origin';

COMMIT;

-- =========================================
-- OPCIÓN 3: Actualizar políticas RLS temporalmente
-- =========================================
-- Si las opciones anteriores no funcionan, puede ser un problema de RLS

-- Deshabilitar RLS temporalmente en las tablas afectadas
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_accounts DISABLE ROW LEVEL SECURITY;

-- Eliminar el usuario
DELETE FROM public.broker_accounts WHERE user_id::text = 'dfe5c068-bddf-419d-b816-08303dd276ea';
DELETE FROM public.profiles WHERE id = 'dfe5c068-bddf-419d-b816-08303dd276ea';
DELETE FROM public.users WHERE id = 'dfe5c068-bddf-419d-b816-08303dd276ea';
DELETE FROM auth.users WHERE id = 'dfe5c068-bddf-419d-b816-08303dd276ea';

-- Rehabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_accounts ENABLE ROW LEVEL SECURITY;

-- =========================================
-- OPCIÓN 4: Función con permisos de superusuario
-- =========================================
-- Crear una función que se ejecute con permisos elevados

CREATE OR REPLACE FUNCTION delete_user_force(user_email TEXT)
RETURNS void AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Obtener el UUID del usuario
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado: %', user_email;
    END IF;
    
    -- Eliminar con permisos elevados
    DELETE FROM auth.users WHERE id = user_uuid CASCADE;
    
    RAISE NOTICE 'Usuario % eliminado exitosamente', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar la función
SELECT delete_user_force('leonagustp@gmail.com');

-- Luego eliminar la función
DROP FUNCTION IF EXISTS delete_user_force(TEXT);

-- =========================================
-- VERIFICACIÓN
-- =========================================
SELECT COUNT(*) as "Usuario existe" FROM auth.users WHERE email = 'leonagustp@gmail.com';