-- ===============================
-- VERIFICAR ESTRUCTURA COMPLETA DE SUPABASE
-- ===============================

-- 1. Ver TODAS las tablas que existen
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Ver todas las columnas de cada tabla (estructura completa)
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. Buscar tablas que tengan palabras clave relacionadas
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%master%' OR
    tablename LIKE '%copy%' OR
    tablename LIKE '%trader%' OR
    tablename LIKE '%strategy%' OR
    tablename LIKE '%config%'
  )
ORDER BY tablename;
