-- Get column names for copy_relationships
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'copy_relationships'
ORDER BY ordinal_position;

-- Get column names for master_traders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'master_traders'
ORDER BY ordinal_position;
