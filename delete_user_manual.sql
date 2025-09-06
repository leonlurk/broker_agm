-- OPCIÓN 1: Eliminar usuario manualmente desde Supabase Dashboard
-- 1. Ve a Authentication > Users en tu dashboard de Supabase
-- 2. Busca el usuario leonagustp@gmail.com
-- 3. Click en los 3 puntos y selecciona "Delete user"
-- 4. Supabase eliminará automáticamente los datos relacionados

-- OPCIÓN 2: Usar la API de Supabase Admin
-- Puedes usar este comando curl (reemplaza los valores):
/*
curl -X DELETE \
  'https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users/USER_ID' \
  -H 'apikey: YOUR_SERVICE_ROLE_KEY' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
*/

-- OPCIÓN 3: Script SQL más agresivo que ignora las relaciones
-- ADVERTENCIA: Esto podría dejar datos huérfanos

-- Primero obtén el ID del usuario
SELECT id FROM auth.users WHERE email = 'leonagustp@gmail.com';
-- Resultado: dfe5c068-bddf-419d-b816-08303dd276ea

-- Luego ejecuta cada DELETE individualmente, ignorando los errores:

-- 1. Intenta eliminar de auth.users directamente (esto podría fallar por foreign keys)
DELETE FROM auth.users WHERE email = 'leonagustp@gmail.com';

-- Si falla, primero elimina de las tablas públicas:
DELETE FROM public.profiles WHERE id = 'dfe5c068-bddf-419d-b816-08303dd276ea';
DELETE FROM public.users WHERE id = 'dfe5c068-bddf-419d-b816-08303dd276ea';

-- Luego intenta eliminar las cuentas de broker con ambos formatos:
DELETE FROM public.broker_accounts WHERE user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea';
DELETE FROM public.broker_accounts WHERE user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea'::text;

-- Finalmente, intenta eliminar de auth.users nuevamente
DELETE FROM auth.users WHERE id = 'dfe5c068-bddf-419d-b816-08303dd276ea';

-- OPCIÓN 4: Deshabilitar temporalmente las foreign keys (PELIGROSO)
-- Solo usa esto si entiendes las implicaciones
/*
SET session_replication_role = 'replica';
DELETE FROM auth.users WHERE email = 'leonagustp@gmail.com';
SET session_replication_role = 'origin';
*/