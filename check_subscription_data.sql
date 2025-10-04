-- Check YOUR subscriptions with all the IDs we need for the frontend
SELECT
    cr.id as subscription_id,
    cr.master_user_id,
    cr.follower_user_id,
    cr.master_mt5_account_id,
    cr.follower_mt5_account_id,
    cr.status,
    cr.risk_ratio,
    master.id as master_profile_id,
    master.username as master_username,
    master.email as master_email,
    follower.email as your_email
FROM copy_relationships cr
LEFT JOIN profiles master ON cr.master_user_id = master.id
LEFT JOIN profiles follower ON cr.follower_user_id = follower.id
WHERE follower.email = 'tytfacundoomar@gmail.com'
AND cr.status = 'active';
