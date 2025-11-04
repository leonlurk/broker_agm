-- ===============================
-- VERIFICAR MASTER TRADERS EN SUPABASE
-- ===============================

-- 1. Ver todas las tablas relacionadas con copy trading
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%master%' OR table_name LIKE '%copy%' OR table_name LIKE '%trader%'
ORDER BY table_name;

-- 2. Verificar si existe tabla de master traders
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'master_traders'
) as master_traders_exists;

-- 3. Si existe, ver TODOS los registros de master traders
SELECT * FROM master_traders ORDER BY created_at DESC;

-- 4. Buscar registros para tu usuario específico (reemplaza con tu user_id)
-- Tu user_id es: a153a6d6-e48d-4297-9a64-395c462e138f
SELECT * FROM master_traders
WHERE user_id = 'a153a6d6-e48d-4297-9a64-395c462e138f';

-- 5. Ver también la tabla de configuraciones si existe
SELECT * FROM copy_trading_config
WHERE user_id = 'a153a6d6-e48d-4297-9a64-395c462e138f';

-- 6. Verificar tabla de strategies si existe
SELECT * FROM strategies
WHERE user_id = 'a153a6d6-e48d-4297-9a64-395c462e138f';

-- 7. Ver TODAS las tablas públicas para identificar cuál guarda los master traders
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
