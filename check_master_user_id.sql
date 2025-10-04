-- Check if the master_user_id from copy_relationships exists in profiles
SELECT 
  cr.master_user_id,
  cr.follower_user_id,
  p.id as profile_id,
  p.name as profile_name,
  p.email
FROM public.copy_relationships cr
LEFT JOIN public.profiles p ON cr.master_user_id = p.id
WHERE cr.follower_user_id = '7a5a56a9-c71d-48d0-b66a-400de84b829b'
  AND cr.status = 'active';

-- Also check what user_id you're logged in as
SELECT id, name, email, is_master_trader
FROM public.profiles
WHERE id = '7a5a56a9-c71d-48d0-b66a-400de84b829b';
