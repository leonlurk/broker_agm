-- Verificar si existe la tabla copy_relationships necesaria para Copy Trading
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'copy_relationships'
ORDER BY ordinal_position;

-- Si no existe, mostrar las tablas relacionadas con copy trading
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%copy%' OR table_name LIKE '%trading%'
ORDER BY table_name;
