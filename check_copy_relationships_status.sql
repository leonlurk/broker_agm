-- Check the status constraint on copy_relationships table
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.copy_relationships'::regclass
  AND conname LIKE '%status%';

-- Also show current status values in the table
SELECT DISTINCT status, COUNT(*) 
FROM public.copy_relationships 
GROUP BY status;
