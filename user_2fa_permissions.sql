-- ============================================
-- Permisos completos para la tabla user_2fa
-- ============================================

-- 1. Asegurar que RLS está habilitado
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can delete their own 2FA settings" ON public.user_2fa;

-- 3. Crear una política permisiva para usuarios autenticados
-- Esta política permite todas las operaciones para usuarios autenticados en sus propios registros
CREATE POLICY "Enable all for authenticated users" ON public.user_2fa
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Otorgar permisos completos a la tabla
GRANT ALL PRIVILEGES ON public.user_2fa TO authenticated;
GRANT ALL PRIVILEGES ON public.user_2fa TO service_role;

-- 5. Asegurar que el esquema public es accesible
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 6. Verificar que las políticas están activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_2fa';

-- 7. Verificar permisos
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'user_2fa';