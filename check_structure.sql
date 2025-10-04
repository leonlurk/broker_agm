-- ============================================
-- Check Database Structure First
-- ============================================

-- 1. Check profiles table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check copy_relationships table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'copy_relationships'
ORDER BY ordinal_position;

-- 3. Check if copy_relationships table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%copy%'
ORDER BY table_name;

-- 4. Check all tables in the database
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
