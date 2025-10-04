-- First, get the actual column structure of profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Then check the copy_relationships record with correct profile columns
SELECT 
  cr.id,
  cr.master_user_id,
  cr.follower_user_id,
  cr.follower_mt5_account_id,
  cr.status,
  cr.created_at,
  p.id as profile_id,
  p.email as profile_email,
  p.full_name as profile_name
FROM copy_relationships cr
LEFT JOIN profiles p ON p.id = cr.master_user_id
WHERE cr.master_user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea'
  AND cr.follower_user_id = '7a5a56a9-c71d-48d0-b66a-400de84b829b';

-- Check if there are any RLS policies blocking the update
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'copy_relationships';

-- Test the actual UPDATE query that the backend is trying to execute
-- (This is a dry-run to see if it would work)
SELECT 
  id,
  master_user_id,
  follower_user_id,
  status
FROM copy_relationships
WHERE master_user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea'
  AND follower_user_id = '7a5a56a9-c71d-48d0-b66a-400de84b829b'
  AND status = 'active';
