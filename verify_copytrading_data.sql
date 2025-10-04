-- ============================================
-- Copy Trading Data Verification Script
-- ============================================

-- 1. Check all master traders and their follower counts
SELECT
    p.id as master_user_id,
    p.email,
    p.username,
    p.name,
    COUNT(DISTINCT cr.follower_user_id) as actual_followers,
    COALESCE(p.follower_count, 0) as stored_follower_count
FROM profiles p
LEFT JOIN copy_relationships cr
    ON p.id = cr.master_user_id
    AND cr.status = 'active'
WHERE p.id IN (
    SELECT DISTINCT master_user_id
    FROM copy_relationships
)
GROUP BY p.id, p.email, p.username, p.name, p.follower_count
ORDER BY actual_followers DESC;

-- 2. Show all active copy relationships with master and follower details
SELECT
    cr.id,
    cr.master_user_id,
    master.email as master_email,
    master.username as master_username,
    cr.follower_user_id,
    follower.email as follower_email,
    follower.username as follower_username,
    cr.master_mt5_account,
    cr.follower_mt5_account,
    cr.risk_ratio,
    cr.status,
    cr.created_at
FROM copy_relationships cr
LEFT JOIN profiles master ON cr.master_user_id = master.id
LEFT JOIN profiles follower ON cr.follower_user_id = follower.id
WHERE cr.status = 'active'
ORDER BY cr.created_at DESC;

-- 3. Check if follower_count column exists and needs updating
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('follower_count', 'is_master');

-- 4. Show your specific user's copy relationships (replace with your email)
-- CHANGE 'your-email@example.com' to your actual email
SELECT
    cr.id,
    cr.master_user_id,
    master.email as master_email,
    master.username as master_name,
    cr.follower_user_id,
    follower.email as follower_email,
    cr.status,
    cr.created_at
FROM copy_relationships cr
LEFT JOIN profiles master ON cr.master_user_id = master.id
LEFT JOIN profiles follower ON cr.follower_user_id = follower.id
WHERE follower.email = 'tytfacundoomar@gmail.com'  -- Change this to your email
ORDER BY cr.created_at DESC;

-- 5. Update follower_count for all masters (if column exists)
-- This will sync the follower_count with actual active relationships
UPDATE profiles
SET follower_count = (
    SELECT COUNT(*)
    FROM copy_relationships cr
    WHERE cr.master_user_id = profiles.id
    AND cr.status = 'active'
)
WHERE id IN (
    SELECT DISTINCT master_user_id
    FROM copy_relationships
);

-- 6. Verify the update worked
SELECT
    p.id,
    p.email,
    p.username,
    p.follower_count,
    COUNT(cr.id) as actual_active_followers
FROM profiles p
LEFT JOIN copy_relationships cr
    ON p.id = cr.master_user_id
    AND cr.status = 'active'
WHERE p.id IN (
    SELECT DISTINCT master_user_id
    FROM copy_relationships
)
GROUP BY p.id, p.email, p.username, p.follower_count
HAVING p.follower_count != COUNT(cr.id)
ORDER BY p.email;
