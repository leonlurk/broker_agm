-- ===============================
-- VERIFICAR MASTER TRADERS - VERSION SIMPLE
-- ===============================

-- 1. Ver TODAS las tablas públicas
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Ver todas las tablas con 'user_id' column
SELECT DISTINCT table_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'user_id'
ORDER BY table_name;

-- 3. Verificar si existe tabla master_traders
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'master_traders'
) as master_traders_exists;
