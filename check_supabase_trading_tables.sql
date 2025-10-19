-- Verificar estructura de tablas relacionadas con trading en Supabase

-- 1. Listar todas las tablas disponibles
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Buscar tablas que contengan "deal" o "trade" en el nombre
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND (table_name ILIKE '%deal%' OR table_name ILIKE '%trade%' OR table_name ILIKE '%position%')
ORDER BY table_name;

-- 3. Ver estructura de broker_accounts (sabemos que existe)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'broker_accounts'
ORDER BY ordinal_position;

-- 4. Buscar tablas relacionadas con balance/history
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND (table_name ILIKE '%balance%' OR table_name ILIKE '%history%' OR table_name ILIKE '%metric%')
ORDER BY table_name;

-- 5. Ver todas las tablas con sus columnas (resumen)
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count,
    STRING_AGG(c.column_name, ', ' ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;
