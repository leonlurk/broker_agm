-- ============================================
-- Copy Trading Data Verification & Fix Script
-- ============================================

-- 1. Check YOUR copy relationships (you're following someone)
SELECT
    cr.id,
    cr.master_user_id,
    master.email as master_email,
    master.username as master_username,
    master.full_name as master_name,
    cr.follower_user_id,
    follower.email as follower_email,
    cr.master_mt5_account_id,
    cr.follower_mt5_account_id,
    cr.risk_ratio,
    cr.status,
    cr.created_at
FROM copy_relationships cr
LEFT JOIN profiles master ON cr.master_user_id = master.id
LEFT JOIN profiles follower ON cr.follower_user_id = follower.id
WHERE follower.email = 'tytfacundoomar@gmail.com'  -- Your email
ORDER BY cr.created_at DESC;

-- 2. Count active followers for each master trader
SELECT
    p.id as master_user_id,
    p.email,
    p.username,
    p.full_name,
    COUNT(DISTINCT cr.follower_user_id) as active_followers
FROM profiles p
LEFT JOIN copy_relationships cr
    ON p.id = cr.master_user_id
    AND cr.status = 'active'
WHERE p.is_master_trader = true
GROUP BY p.id, p.email, p.username, p.full_name
ORDER BY active_followers DESC;

-- 3. Show all active copy relationships
SELECT
    cr.id,
    master.email as master_email,
    master.username as master_username,
    follower.email as follower_email,
    follower.username as follower_username,
    cr.status,
    cr.created_at
FROM copy_relationships cr
LEFT JOIN profiles master ON cr.master_user_id = master.id
LEFT JOIN profiles follower ON cr.follower_user_id = follower.id
WHERE cr.status = 'active'
ORDER BY cr.created_at DESC;

-- 4. ADD follower_count column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;

-- 5. Update follower_count for all master traders
UPDATE profiles
SET follower_count = (
    SELECT COUNT(*)
    FROM copy_relationships cr
    WHERE cr.master_user_id = profiles.id
    AND cr.status = 'active'
)
WHERE is_master_trader = true;

-- 6. Verify the follower_count was updated correctly
SELECT
    p.id,
    p.email,
    p.username,
    p.full_name,
    p.follower_count,
    COUNT(cr.id) as actual_active_followers
FROM profiles p
LEFT JOIN copy_relationships cr
    ON p.id = cr.master_user_id
    AND cr.status = 'active'
WHERE p.is_master_trader = true
GROUP BY p.id, p.email, p.username, p.full_name, p.follower_count
ORDER BY p.follower_count DESC;

-- 7. Create a function to auto-update follower_count (optional but recommended)
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the master's follower count
    UPDATE profiles
    SET follower_count = (
        SELECT COUNT(*)
        FROM copy_relationships
        WHERE master_user_id = COALESCE(NEW.master_user_id, OLD.master_user_id)
        AND status = 'active'
    )
    WHERE id = COALESCE(NEW.master_user_id, OLD.master_user_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-update follower_count on copy_relationships changes
DROP TRIGGER IF EXISTS update_follower_count_trigger ON copy_relationships;
CREATE TRIGGER update_follower_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON copy_relationships
FOR EACH ROW
EXECUTE FUNCTION update_follower_count();
