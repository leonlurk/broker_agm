-- ============================================
-- Fix ONLY permissions for user_2fa table
-- No structure changes, only RLS and permissions
-- ============================================

-- 1. Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'user_2fa'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_2fa', pol.policyname);
    END LOOP;
END $$;

-- 3. Create a single comprehensive policy that allows everything for authenticated users on their own records
CREATE POLICY "Users can fully manage their own 2FA" ON public.user_2fa
AS PERMISSIVE
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Also allow service_role full access (for admin operations)
CREATE POLICY "Service role has full access" ON public.user_2fa
AS PERMISSIVE
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Grant all permissions to the table
GRANT ALL ON public.user_2fa TO authenticated;
GRANT ALL ON public.user_2fa TO service_role;
GRANT ALL ON public.user_2fa TO anon; -- Sometimes needed for initial auth flow

-- 6. Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;

-- 7. Grant sequence permissions if exists
DO $$
BEGIN
    -- Check if any sequences exist for this table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public' 
        AND sequence_name LIKE 'user_2fa%'
    ) THEN
        EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated';
        EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role';
    END IF;
END $$;

-- 8. IMPORTANT: Ensure auth schema is accessible
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;

-- 9. Verify the new policies
SELECT 
    policyname as "Policy Name",
    permissive as "Permissive",
    roles as "Roles",
    cmd as "Command",
    qual as "USING clause",
    with_check as "WITH CHECK clause"
FROM pg_policies 
WHERE tablename = 'user_2fa'
ORDER BY policyname;

-- 10. Verify permissions
SELECT 
    grantee as "Role",
    string_agg(privilege_type, ', ') as "Privileges"
FROM information_schema.role_table_grants 
WHERE table_name = 'user_2fa'
GROUP BY grantee
ORDER BY grantee;

-- 11. Test with a sample query (replace with actual user_id)
-- This simulates what the app does
SELECT 
    'Testing query for user_id efcbcf9b-2b44-4514-bf1d-28f77f61d279' as test_description,
    COUNT(*) as records_found
FROM public.user_2fa
WHERE user_id = 'efcbcf9b-2b44-4514-bf1d-28f77f61d279'::uuid;