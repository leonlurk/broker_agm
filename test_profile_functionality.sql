-- Test para verificar que todo funciona correctamente

-- 1. Verificar que profiles tiene todas las columnas necesarias
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS en profiles
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Verificar que payment_methods existe y tiene políticas
SELECT 
    'payment_methods' as tabla,
    COUNT(*) as num_policies
FROM pg_policies
WHERE tablename = 'payment_methods';

-- 4. Verificar triggers activos
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('profiles', 'payment_methods')
ORDER BY event_object_table, trigger_name;

-- 5. Test de inserción simulada (no se ejecuta, solo muestra la estructura)
SELECT 
    'Estructura lista para:' as accion,
    'INSERT INTO profiles (id, email, username, nombre, apellido, photourl, ...)' as ejemplo
UNION ALL
SELECT 
    'Y también para:' as accion,
    'INSERT INTO payment_methods (user_id, type, alias, network, address, ...)' as ejemplo;