-- Check for any triggers on copy_relationships that might interfere
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'copy_relationships'
ORDER BY trigger_name;

-- Check the exact constraint definition
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'copy_relationships'::regclass
  AND conname LIKE '%status%';

-- Test the actual UPDATE that should happen (DRY RUN - just SELECT to see what would be updated)
SELECT 
  id,
  master_user_id,
  follower_user_id,
  status,
  'inactive' as new_status,
  now() as new_updated_at
FROM copy_relationships
WHERE master_user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea'
  AND follower_user_id = '7a5a56a9-c71d-48d0-b66a-400de84b829b'
  AND status = 'active';

-- Now actually try the UPDATE (THIS WILL MODIFY DATA)
-- Comment this out if you just want to check first
UPDATE copy_relationships
SET 
  status = 'inactive',
  updated_at = now()
WHERE id = 'b180fa07-41d5-495e-ab67-63edc747d569'
RETURNING *;
