-- ============================================
-- Test script to verify user can access their 2FA records
-- Run this as the authenticated user to test access
-- ============================================

-- Replace this with an actual user ID from your system
-- You can get this from the console logs when the error occurs
SET LOCAL "request.jwt.claims.sub" TO 'efcbcf9b-2b44-4514-bf1d-28f77f61d279';

-- Test 1: Try to select from user_2fa table
SELECT 
    user_id,
    is_enabled,
    secret_key IS NOT NULL as has_secret,
    two_fa_method,
    created_at
FROM public.user_2fa
WHERE user_id = current_setting('request.jwt.claims.sub')::uuid;

-- Test 2: Try to insert a test record (will rollback)
BEGIN;
INSERT INTO public.user_2fa (user_id, is_enabled, secret_key)
VALUES (
    current_setting('request.jwt.claims.sub')::uuid,
    false,
    'test_secret'
)
ON CONFLICT (user_id) DO NOTHING;

-- Check if insert worked
SELECT * FROM public.user_2fa WHERE user_id = current_setting('request.jwt.claims.sub')::uuid;

-- Rollback the test insert
ROLLBACK;

-- Test 3: Check current policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_2fa';

-- Test 4: Check if auth.uid() function works
SELECT auth.uid();

-- Test 5: Verify the user_id format matches
SELECT 
    COUNT(*) as matching_format
FROM public.user_2fa
WHERE user_id::text LIKE '________-____-____-____-____________';