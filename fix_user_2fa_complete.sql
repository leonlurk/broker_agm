-- ============================================
-- Complete fix for user_2fa table
-- Fixes structure, permissions, and RLS policies
-- ============================================

-- 1. First, check if the table exists and its current structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_2fa'
ORDER BY ordinal_position;

-- 2. Add any missing columns (won't error if they already exist)
ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS two_fa_method TEXT DEFAULT 'authenticator';

ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'app';

ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS backup_codes TEXT[];

ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS enabled_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_2fa 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- 3. Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- 4. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Users can delete their own 2FA settings" ON public.user_2fa;
DROP POLICY IF EXISTS "Allow authenticated users to read own 2FA" ON public.user_2fa;
DROP POLICY IF EXISTS "Allow authenticated users to insert own 2FA" ON public.user_2fa;
DROP POLICY IF EXISTS "Allow authenticated users to update own 2FA" ON public.user_2fa;
DROP POLICY IF EXISTS "Allow authenticated users to delete own 2FA" ON public.user_2fa;

-- 5. Create new comprehensive policy for authenticated users
-- This single policy handles all operations
CREATE POLICY "Users manage own 2FA" ON public.user_2fa
FOR ALL 
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- 6. Also create a policy for service role (for admin operations)
CREATE POLICY "Service role full access" ON public.user_2fa
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Grant necessary permissions
GRANT ALL ON public.user_2fa TO authenticated;
GRANT ALL ON public.user_2fa TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 8. If there's a sequence for the id column, grant usage
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public' 
        AND sequence_name = 'user_2fa_id_seq'
    ) THEN
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.user_2fa_id_seq TO authenticated';
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.user_2fa_id_seq TO service_role';
    END IF;
END $$;

-- 9. Create or replace function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_2fa_updated_at ON public.user_2fa;
CREATE TRIGGER update_user_2fa_updated_at
BEFORE UPDATE ON public.user_2fa
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 11. Test the policies
-- This should show the policies we just created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_2fa'
ORDER BY policyname;

-- 12. Test permissions
SELECT 
    grantee,
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'user_2fa'
ORDER BY grantee, privilege_type;

-- 13. Important: Make sure the auth schema is accessible
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;

-- 14. Verify final table structure
SELECT 
    column_name as "Column",
    data_type as "Type",
    is_nullable as "Nullable",
    column_default as "Default"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_2fa'
ORDER BY ordinal_position;