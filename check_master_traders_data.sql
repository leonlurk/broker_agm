-- ===============================
-- VERIFICAR DATOS DE MASTER TRADERS
-- ===============================

-- 1. Ver la estructura de la tabla master_traders
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'master_traders'
ORDER BY ordinal_position;

-- 2. Ver TODOS los registros de master_traders
SELECT * FROM master_traders ORDER BY created_at DESC;

-- 3. Buscar TU registro específico
SELECT * FROM master_traders
WHERE user_id = 'a153a6d6-e48d-4297-9a64-395c462e138f';

-- 4. Contar cuántos master traders hay
SELECT COUNT(*) as total_master_traders FROM master_traders;

-- 5. Ver también copy_relationships (puede tener info relacionada)
SELECT * FROM copy_relationships
WHERE master_user_id = 'a153a6d6-e48d-4297-9a64-395c462e138f'
   OR follower_user_id = 'a153a6d6-e48d-4297-9a64-395c462e138f';

-- 6. Ver copy_stats (puede tener estadísticas)
SELECT * FROM copy_stats
WHERE user_id = 'a153a6d6-e48d-4297-9a64-395c462e138f';
