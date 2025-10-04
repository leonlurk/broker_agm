-- Verificar si la tabla copy_relationships existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'copy_relationships';

-- Verificar columnas de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'copy_relationships'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'copy_relationships';

-- Verificar datos existentes
SELECT 
    id,
    master_id,
    follower_id,
    follower_mt5_account_id,
    risk_ratio,
    status,
    created_at
FROM copy_relationships
ORDER BY created_at DESC
LIMIT 10;
