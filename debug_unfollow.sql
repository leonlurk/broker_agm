-- Check the exact copy_relationships record that should be updated
SELECT 
  id,
  master_user_id,
  follower_user_id,
  follower_mt5_account_id,
  status,
  created_at,
  updated_at
FROM copy_relationships
WHERE master_user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea'
  AND follower_user_id = '7a5a56a9-c71d-48d0-b66a-400de84b829b'
  AND status = 'active';

-- Check if there are any triggers on the table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'copy_relationships';
