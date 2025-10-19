-- Verificar si el registro existe y su estado actual
SELECT 
  id,
  master_user_id,
  follower_user_id,
  master_mt5_account_id,
  follower_mt5_account_id,
  status,
  created_at,
  updated_at
FROM copy_relationships
WHERE master_user_id = 'dfe5c068-bddf-419d-b816-08303dd276ea'
  AND follower_user_id = '7a5a56a9-c71d-48d0-b66a-400de84b829b'
ORDER BY created_at DESC;

-- Verificar el constraint único
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'copy_relationships'::regclass
  AND conname = 'copy_relationships_master_follower_unique';
