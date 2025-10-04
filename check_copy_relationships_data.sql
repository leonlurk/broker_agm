-- Check the current copy_relationships data
SELECT 
  id,
  master_user_id,
  follower_user_id,
  follower_mt5_account_id,
  status,
  risk_ratio,
  created_at
FROM public.copy_relationships
ORDER BY created_at DESC
LIMIT 10;

-- Also check the master_traders table to see valid master_user_ids
SELECT 
  id,
  user_id,
  mt5_account_id,
  display_name,
  is_active
FROM public.master_traders
LIMIT 10;
