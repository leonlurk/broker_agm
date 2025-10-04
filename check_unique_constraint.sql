-- Check for unique constraints on copy_relationships
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'copy_relationships'::regclass
  AND contype IN ('u', 'p')  -- unique or primary key
ORDER BY conname;

-- Check if there are multiple records for the same master-follower pair
SELECT 
  master_user_id,
  follower_user_id,
  COUNT(*) as record_count,
  array_agg(status) as statuses,
  array_agg(id) as ids
FROM copy_relationships
WHERE master_user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea'
  AND follower_user_id = '7a5a56a9-c71d-48d0-b66a-400de84b829b'
GROUP BY master_user_id, follower_user_id;

-- Show all records for this master-follower pair
SELECT *
FROM copy_relationships
WHERE master_user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea'
  AND follower_user_id = '7a5a56a9-c71d-48d0-b66a-400de84b829b'
ORDER BY created_at DESC;
